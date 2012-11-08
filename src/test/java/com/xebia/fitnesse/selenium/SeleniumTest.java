package com.xebia.fitnesse.selenium;


import static org.junit.Assert.*;

import java.net.MalformedURLException;
import java.net.URL;

import org.junit.Test;
import org.mockito.Mockito;
import org.openqa.selenium.*;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;

public class SeleniumTest  {
    
    @Test
    public void testRun() throws MalformedURLException {
        String hubURL = "http://localhost:4444/wd/hub";
        DesiredCapabilities capability = DesiredCapabilities.firefox();
        capability.setBrowserName("firefox");
        //capability.setPlatform("WINDOWS");
        //capability.setVersion("9.0.4");
        WebDriver driver = new RemoteWebDriver(new URL(hubURL), capability);
        driver.get("http://www.google.com");
        WebElement element = driver.findElement(By.name("q")); 
        element.sendKeys("Cheese!");
        element.submit();
        driver.quit(); 
        assertTrue(true);
        
    }
    
}
