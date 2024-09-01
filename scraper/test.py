from report_parser import ReportParser

page = []

with open("conflicting_schedule.html") as file:
    page.append(file.read())

rp = ReportParser()

schedule_reqs = rp.parse_reports_html(page)

for i in schedule_reqs:
    i.print_self()