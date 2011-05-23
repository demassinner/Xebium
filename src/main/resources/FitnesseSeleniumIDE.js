/**
* Format TestCase and return the source.
*
* @param testCase TestCase to format
* @param name The name of the test case, if any. It may be used to embed title into the source.
*/
function format(testCase, name) {
     var baseUrl = testCase.baseUrl || options.baseUrl;
    
     var commandsText = '| script | selenium driver fixture |\n';
     commandsText += '| start browser | ' + options.browser + ' | on url | ' + baseUrl + ' |\n';
     commandsText += formatCommands(testCase.commands);
     commandsText += '| stop browser |\n';
 
     return commandsText;
}

/**
 * Format an array of commands to the snippet of source.
 * Used to copy the source into the clipboard.
 *
 * @param The array of commands to sort.
 */
function formatCommands(commands) {
    var commandsText = '';
    
    for (i = 0; i < commands.length; i++) {
        commandsText += getSourceForCommand(commands[i]) + "\n";
    }
    return  commandsText;
}


function getSourceForCommand(commandObj) {
	function escape(s) {
		var m;
		if (m = /^\$\{(\w+)\}$/.exec(s)) { return '$' + m[1]; }
     	if (/^https?:\/\//.test(s) || /^[A-Z][a-z0-9]+[A-Z]/.test(s) || /@/.test(s)) { return "!-" + s + "-!"; }
		return s;
	}
	
	var text = null;

    if (commandObj.type == 'comment') {
    	return "| note | " + commandObj.comment + " |";
    } else if (commandObj.type == 'command') {
        // Set up variables to use for substitution
        var command = commandObj.command;
        var target = commandObj.target;
        var value = commandObj.value;
         
        if (/^store/.test(command)) {
         	if (value === '') {
             	return "| $" + target + "= | is | " + command.replace(/^store/, "get") + " |";
         	} else {
             	return "| $" + value + "= | is | " + command.replace(/^store/, "get") + " | on | " + escape(target) + " |";
         	}
//        } else if (/^set/.test(command)) {
//        	return "| set " + command.replace(/^set([A-Z])/, /\1l/
     	} else if (value === '') {
             return "| ensure | do | " + command + " | on | " + escape(target) + " |";
        } else {
            return "| ensure | do | " + command + " | on | " + escape(target) + " | with | " + escape(value) + " |";
        }
    }
    return "| note | !-Untranslatable: '" + commandObj.toString + "'-! |";
}

/**
 * Parse source and update TestCase. Throw an exception if any error occurs.
 *
 * @param testCase TestCase to update
 * @param source The source to parse
 */
function parse(testCase, source) {
     var commands = [];

    var lines = source.split(/\n/g);

    for (i = 0; i < lines.length; i++) {
        // Catch some special cases (?)
        // TODO: extract BaseUrl
        log.debug('Parsing line ' + i + ': "' + lines[i] + '"');
        var command;
        
        try {
        	command = getCommandForSource(lines[i]);
        } catch (err) {
        	if (err == 'unparsable') {
	    		if (/\t/.test(lines[i])) {
	    			// Line may be pasted directly from FitNesse page output
	    			var line = '|' + lines[i].replace(/\t/g, '|') + '|';
	    			try {
	    				command = getCommandForSource(line);
	    			} catch (err) {
	    	        	if (err == 'unparsable') {
	    	        		command = new Comment("Can't parse line: '" + line + "'");
	    	        	} else {
	    	        		log.error(err);
	    	        	}
	    			}
	    		} else {
	    			command = new Comment("Can't parse line: '" + lines[i] + "'");
	    		}
        	} else {
        		log.error(err);
        	}
        }
        if (command) commands.push(command);    
    }
    
     testCase.commands = commands;
}

function getCommandForSource(line) {
	function unescape(s) {
		var m;
		// Convert variable from $fit to ${selenese} style
		if (m = /\$(\w+)$/.exec(s)) { s = '${' + m[1] + '}'; }
		// Clear escape characters from text section
		if (m = /^!-(.+?)-!$/.exec(s)) { s = m[1]; }
		return s;
	}
	
	var match;
	
	// | ensure | do | ${command} | on | ${target} | with | ${value} |
	if (match = /^\|\s*ensure\s*\|\s*do\s*\|\s*([^\|\s]+)\s*\|\s*on\s*\|\s*([^\|\s]+)\s*\|\s*with\s*\|\s*([^\|]+?)\s*\|\s*/.exec(line)) {
		return new Command(match[1], unescape(match[2]), unescape(match[3]));

	// | ensure | do | ${command} | on | ${target} |
	} else if (match = /^\|\s*ensure\s*\|\s*do\s*\|\s*([^\|\s]+)\s*\|\s*on\s*\|\s*([^\|]+?)\s*\|\s*/.exec(line)) {
		return new Command(match[1], unescape(match[2]));

	// format: | $value= | is | ${command} | on | ${target} |
	} else if (match = /^\|\s*\$([^\|\s]+)=\s*\|\s*is\s*\|\s*([^\|\s]+)\s*\|\s*on\s*\|\s*([^\|\s]+)\s*\|\s*/.exec(line)) {
		return new Command(match[2].replace(/^get/, 'store'), unescape(match[3]), unescape(match[1]));

	// format: | $value= | is | ${command} |
	} else if (match = /^\|\s*\$([^\|\s]+)=\s*\|\s*is\s*\|\s*([^\|\s]+)\s*\|\s*/.exec(line)) {
		return new Command(match[2].replace(/^get/, 'store'), unescape(match[1]));

	// format: | note | ${text} |
	} else if (match = /^\|\s*note\s*\|\s*(.+?)\s*\|\s*/.exec(line)) {
		return new Comment(match[1]);
		
	// Ignore | script/scenario/start browser/stop browser |, log the rest
	} else if (!/^\s*$/.test(line) && !/^\|\s*script\s*\|.*/i.test(line) && !/^\|\s*scenario\s*\|.*/i.test(line) && !/^\|\s*(start|stop)\s+browser\s*\|.*/.test(line)) {
		throw "unparsable";
	}
}

this.options = {
    'browser': 'firefox',
    'baseUrl': 'http://localhost'
}

this.configForm =
        '<description>Default browser</description>' +
        '<textbox id="options_browser" />' +
        '<description>Default base URL</description>' +
        '<textbox id="options_baseUrl" />';
        