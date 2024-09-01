import json


class DayRequest:
    def __init__(self, date, start_time, end_time, shift_hours, alt_dept):
        self.date = date
        self.start_time = start_time
        self.end_time = end_time
        self.shift_hours = shift_hours
        self.alt_dept = alt_dept

    def __str__(self):
        return f'{self.date} : {self.start_time} -> {self.end_time} : {self.shift_hours} : {self.alt_dept}'


class ScheduleRequest:
    def __init__(self, new_week_of, new_total_hours):
        self.week_of = new_week_of
        self.total_hours = new_total_hours
        self.days = list()

    def add_days(self, new_days):
        for day in new_days:
            self.days.append(day)

    def print_self(self):
        print(f'Week of {self.week_of}, total hrs: {self.total_hours}')
        for i in self.days:
            print(i.__str__())

    def to_json(self):
        dict_days = list()
        for day in self.days:
            dict_days.append(dict(
                date=day.date,
                start_time=day.start_time,
                end_time=day.end_time,
                shift_hours=day.shift_hours,
                alt_dept=day.alt_dept
            ))
        return dict(week_of=self.week_of,
                    total_hours=self.total_hours,
                    days=dict_days)