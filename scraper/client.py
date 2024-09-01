from datetime import datetime
import json

import requests

from models import ScheduleRequest


class ScheduleClient:
    def __init__(self, server):
        self.server = server

    def post_schedules(self, schedules: list[ScheduleRequest]):
        url = f'{self.server}/weeks'
        session = requests.session()
        for schedule in schedules:
            schedule_json = schedule.to_json()
            response = session.post(
                url=url,
                json=schedule_json
            )
            print(json.dumps(schedule_json))
            print(response.json())

    def post_status(self, status: bool):
        url = f'{self.server}/scrape/status'
        now = datetime.now()
        now_o_clock = now.strftime("%m/%d/%Y %I:%M %p")
        print(now_o_clock)
        statusData = {
            "is_complete": status,
            "last_updated": now_o_clock
        }
        session = requests.session()
        response = session.post(
            url=url,
            json=statusData
        )
        print(response.json())