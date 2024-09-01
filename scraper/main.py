import os
import threading
import time

from dotenv import load_dotenv

from client import ScheduleClient
from report_parser import ReportParser
from scraper import Scraper
from fastapi import FastAPI, Response

load_dotenv()
auth_secret = os.getenv('TOTP_SECRET')
username = os.getenv('COSTCO_USER')
password = os.getenv('COSTCO_PASS')
backend_server = os.getenv('BACKEND_SERVER')
webdriver_server = os.getenv('WEBDRIVER_SERVER')

scraper = Scraper(username=username, password=password, totp_secret=auth_secret, webdriver_server=webdriver_server)
report_parser = ReportParser()
schedule_client = ScheduleClient(server=backend_server)
is_scraping = False

def scrape():
    global is_scraping
    # Scrape and parse reports
    reports = scraper.get_reports()
    if len(reports) == 0:
        is_scraping = False
        print("Failed scraping reports")
        schedule_client.post_status(False)
        return

    schedules = report_parser.parse_reports_html(reports)
    
    # Send to backend server
    schedule_client.post_schedules(schedules)
    is_scraping = False
    
    # Post "complete" status to backend
    schedule_client.post_status(True)
    
# Start local server
app = FastAPI()

@app.get("/scrape")
def get_scrape(response: Response):
    global is_scraping
    if is_scraping == True:
        response.status_code = 425
        return {"message": "Scraper is currently running, please wait"}
    else:
        is_scraping = True
        scraper_thread = threading.Thread(target=scrape)
        scraper_thread.start()
        return {"message": "Started scraper"}
