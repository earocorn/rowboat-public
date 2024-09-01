import os
import time

from dotenv import load_dotenv
from selenium import webdriver
from selenium.common import NoSuchElementException
from selenium.webdriver.common.by import By
import pyotp
from selenium.webdriver.support.select import Select


class Scraper:
    def __init__(self, username, password, totp_secret, webdriver_server):
        self.username = username
        self.password = password
        self.totp_secret = totp_secret
        self.webdriver_server = webdriver_server

    def get_reports(self):
        auth_secret = self.totp_secret
        username = self.username
        password = self.password

        # For RemoteWebDriver
        options = webdriver.ChromeOptions()
        driver = webdriver.Remote(command_executor=self.webdriver_server, options=options)
        try:
            driver.get("https://ess.costco.com")

            username_field = driver.find_element(By.ID, "username")
            username_field.send_keys(username)

            password_field = driver.find_element(By.ID, "password")
            password_field.send_keys(password)

            time.sleep(1)

            login_button = driver.find_element(By.CLASS_NAME, "button")
            login_button.click()

            time.sleep(5)

            available_buttons = driver.find_element(By.CLASS_NAME, "buttons")
            change_device_button = available_buttons.find_elements(By.CLASS_NAME, "button")[1]
            change_device_button.click()

            time.sleep(3)

            device_list = driver.find_elements(By.CLASS_NAME, "device-item")
            second_device = device_list[1]
            second_device.click()

            time.sleep(1)

            sign_on_button = driver.find_element(By.ID, "device-submit")
            sign_on_button.click()

            time.sleep(1)

            totp = pyotp.TOTP(auth_secret)
            temp_code = totp.now()

            otp_field = driver.find_element(By.ID, "otp")
            otp_field.send_keys(temp_code)

            submit_button = driver.find_element(By.CLASS_NAME, "primary")
            submit_button.click()

            driver.get(
                "https://bireport.costco.com/cognos_ext/bi/?perspective=classicviewer&CAMNamespace=COSTCOEXT&pathRef=.public_folders%2FWarehouse%2FHR%252FPayroll%2FSchedule&ui_appbar=false")

            time.sleep(10)

            cam_username_field = driver.find_element(By.ID, "CAMUsername")
            cam_username_field.send_keys(username)

            cam_password_field = driver.find_element(By.ID, "CAMPassword")
            cam_password_field.send_keys(password)

            time.sleep(1)

            cam_login_button = driver.find_element(By.ID, "signInBtn")
            cam_login_button.click()

            time.sleep(10)

            iframe = driver.find_element(By.TAG_NAME, "iframe")
            driver.switch_to.frame(iframe)

            selector = Select(driver.find_elements(By.TAG_NAME, "select")[1])
            options = selector.options
            num_options = len(options)

            # There is a page change after the first report is generated
            selector.select_by_value(options[0].get_attribute("value"))

            run_button = driver.find_element(By.TAG_NAME, "button")
            run_button.click()

            time.sleep(10)

            scraped_reports = list()
            scraped_reports.append(driver.page_source)

            for index in range(1, num_options):
                selector = Select(driver.find_element(By.TAG_NAME, "select"))
                options = selector.options

                selector.select_by_value(options[index].get_attribute("value"))

                time.sleep(1)

                # First button on page is "Print" to print previous report. So, we need to click the second button.
                run_button = driver.find_elements(By.TAG_NAME, "button")[1]
                run_button.click()

                time.sleep(10)

                scraped_reports.append(driver.page_source)

            driver.quit()
            return scraped_reports
        except NoSuchElementException:
            driver.quit()
            return list()
