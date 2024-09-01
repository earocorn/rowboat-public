import datetime

from bs4 import BeautifulSoup

from models import ScheduleRequest, DayRequest


class ReportParser:
    def __init__(self):
        self.schedule_requests = list()

    def parse_reports_html(self, reports):
        report_data_list = list()

        for report_html in reports:
            soup = BeautifulSoup(report_html, "html.parser")
            table = soup.find('table', attrs={'class': 'ls'})
            table_body = table.find('tbody')

            report_data = list()

            rows = table_body.find_all('tr')
            for row in rows:
                cols = row.find_all('td')
                cols = [ele.text.strip() for ele in cols]
                report_data.append([ele for ele in cols if ele])

            report_data_list.append(report_data)

        for report_index, report in enumerate(report_data_list):
            # Parameters
            total_hours = float(report[-1][1])
            week_of = ""

            days = list()

            num_entries = len(report)
            for row_index, row in enumerate(report):
                print(row)
                if 1 < row_index < num_entries - 1:
                    alt_dept = ''
                    if row[0] == 'Sunday':
                        mon_day_year = row[1].split('/')
                        cur_date = datetime.date(int(mon_day_year[2]), int(mon_day_year[0]), int(mon_day_year[1]))
                        date_iso = cur_date.isoformat()
                        week_of = date_iso
                    if str(row[0][0]).startswith(('M', 'T', 'W', 'F', 'S', 'm', 't', 'w', 'f', 's')):
                        mon_day_year = row[1].split('/')
                        cur_date = datetime.date(int(mon_day_year[2]), int(mon_day_year[0]), int(mon_day_year[1]))
                        date_iso = cur_date.isoformat()
                        # If row has scheduled time and/or shift hours with pay code
                        if len(row) > 2:
                            # Case of no scheduled time but shift hours (i.e. holiday pay)
                            if(len(str(row[2])) < 7 or len(str(row[4])) > 4):
                                cur_start_time = ''
                                cur_end_time = ''
                                shift_hours = float(row[2])
                                alt_dept = row[4]
                            # Case of scheduled time with shift hours
                            else:
                                cur_start_time = row[2]
                                cur_end_time = row[3]
                                shift_hours = float(row[4])
                        # Row has no time and no hours
                        else:
                            cur_start_time = ''
                            cur_end_time = ''
                            shift_hours = 0
                        # If row has alt dept item
                        if len(row) > 6:
                            alt_dept = row[6]

                        day = DayRequest(
                            date=date_iso,
                            start_time=cur_start_time,
                            end_time=cur_end_time,
                            shift_hours=shift_hours,
                            alt_dept=alt_dept,
                        )
                        days.append(day)
                    else:
                        # Extension of first scheduled day
                        refactor_day = days[-1]
                        refactor_day.end_time = row[2]
                        refactor_day.shift_hours = float(row[4])

            schedule_request = ScheduleRequest(new_week_of=week_of, new_total_hours=total_hours)
            schedule_request.add_days(days)
            self.schedule_requests.append(schedule_request)
        return self.schedule_requests
