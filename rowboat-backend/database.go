package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"
)

const weekTable string = "scheduled_week"
const dayTable string = "scheduled_day"
const deviceTable string = "device"
const statusTable string = "status"

func ConnectDatabase() error {
	dbFile := os.Getenv("DB_PATH")

	db, err := sql.Open("sqlite3", dbFile)
	if err != nil {
		return err
	}

	DB = db

	const createWeekTable string = "CREATE TABLE IF NOT EXISTS " + weekTable +
		"(week_id INTEGER PRIMARY KEY NOT NULL," +
		"week_of TEXT NOT NULL UNIQUE," + // DATE has problems
		"has_passed INTEGER NOT NULL," +
		"total_hours REAL NOT NULL" +
		");"
	const createDayTable string = "CREATE TABLE IF NOT EXISTS " + dayTable +
		"(day_id INTEGER PRIMARY KEY NOT NULL," +
		"week_id INTEGER NOT NULL," +
		"date TEXT NOT NULL UNIQUE," + // DATE has problems
		"start_time TIME NOT NULL," +
		"end_time TIME NOT NULL," +
		"shift_hours REAL NOT NULL," +
		"alt_dept TEXT," +
		"manually_changed INTEGER DEFAULT 0," +
		"FOREIGN KEY(week_id) REFERENCES " + weekTable +
		"(week_id)" +
		");"
	const createDeviceTable = "CREATE TABLE IF NOT EXISTS " + deviceTable +
		"(id INTEGER PRIMARY KEY NOT NULL," +
		"token TEXT NOT NULL UNIQUE" +
		");"
	const createStatusTable = "CREATE TABLE IF NOT EXISTS " + statusTable +
		"(id INTEGER PRIMARY KEY NOT NULL," +
		"last_updated TEXT" +
		");"

	if _, weekTableErr := DB.Exec(createWeekTable); weekTableErr != nil {
		return weekTableErr
	}

	if _, dayTableErr := DB.Exec(createDayTable); dayTableErr != nil {
		return dayTableErr
	}

	if _, deviceTableErr := DB.Exec(createDeviceTable); deviceTableErr != nil {
		return deviceTableErr
	}

	if _, statusTableErr := DB.Exec(createStatusTable); statusTableErr != nil {
		return statusTableErr
	}

	return nil
}

func InsertWeek(week ScheduledWeek) (int, error) {
	res := DB.QueryRow("INSERT INTO "+weekTable+""+
		"(week_of, has_passed, total_hours) VALUES(?, ?, ?)"+
		"ON CONFLICT(week_of) DO UPDATE "+
		"SET has_passed = excluded.has_passed,"+
		"total_hours = excluded.total_hours "+
		"RETURNING week_id",
		week.WeekOf, week.HasPassed, week.TotalHours)

	var id int64
	if id := res.Scan(&id); id != nil {
		id = res.Scan(&id)
	}
	return int(id), nil
}

//func InsertDay(day ScheduledDay) (int, error) {
//	res, err := DB.Exec("INSERT INTO "+day_table+" VALUES(NULL, ?, ?, ?, ?, ?, ?)", day_table, day.WeekId, day.Date, day.StartTime, day.EndTime, day.ShiftHours, day.AltDept)
//	if err != nil {
//		return 0, err
//	}
//
//	var id int64
//	if id, err = res.LastInsertId(); err != nil {
//		return 0, err
//	}
//	return int(id), nil
//}

func PatchDay(day ScheduledDay) (int, error) {
	res, err := DB.Exec("UPDATE "+dayTable+" SET start_time = ?, end_time = ?, alt_dept = ?, manually_changed = 1 WHERE day_id = ?", day.StartTime, day.EndTime, day.AltDept, day.DayId)
	if err != nil {
		return 0, err
	}

	var id int64
	if id, err = res.LastInsertId(); err != nil {
		return 0, err
	}
	return int(id), nil
}

func InsertDays(days []DayRequestBody, weekId int) error {
	valueStrings := make([]string, 0, len(days))
	valueArgs := make([]interface{}, 0, len(days)*5)
	for _, day := range days {
		valueStrings = append(valueStrings, "(NULL, "+strconv.Itoa(weekId)+", ?, ?, ?, ?, ?)")
		parsedDate, err := time.Parse(time.DateOnly, day.Date)
		if err != nil {
			return err
		}
		valueArgs = append(valueArgs, parsedDate.Format(time.DateOnly))
		valueArgs = append(valueArgs, day.StartTime)
		valueArgs = append(valueArgs, day.EndTime)
		valueArgs = append(valueArgs, day.ShiftHours)
		valueArgs = append(valueArgs, day.AltDept)
	}
	stmt := fmt.Sprintf("INSERT INTO "+dayTable+""+
		"(day_id, week_id, date, start_time, end_time, shift_hours, alt_dept) VALUES %s "+
		"ON CONFLICT(date) DO UPDATE "+
		"SET week_id = excluded.week_id,"+
		"start_time = excluded.start_time,"+
		"end_time = excluded.end_time,"+
		"shift_hours = excluded.shift_hours,"+
		"alt_dept = excluded.alt_dept "+
		"WHERE manually_changed = 0",
		strings.Join(valueStrings, ","))
	_, err := DB.Exec(stmt, valueArgs...)
	return err
}

func RetrieveAllWeeks() ([]ScheduledWeek, error) {
	rows, err := DB.Query("SELECT * FROM " + weekTable)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var data []ScheduledWeek
	for rows.Next() {
		i := ScheduledWeek{}
		err = rows.Scan(&i.WeekId, &i.WeekOf, &i.HasPassed, &i.TotalHours)
		if err != nil {
			return nil, err
		}
		data = append(data, i)
	}
	return data, nil
}

func RetrieveAllDaysByWeekId(weekId int64) ([]ScheduledDay, error) {
	rows, err := DB.Query("SELECT * FROM "+dayTable+" WHERE week_id=?", weekId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var data []ScheduledDay
	for rows.Next() {
		i := ScheduledDay{}
		err = rows.Scan(&i.DayId, &i.WeekId, &i.Date, &i.StartTime, &i.EndTime, &i.ShiftHours, &i.AltDept, &i.ManuallyChanged)
		if err != nil {
			return nil, err
		}
		data = append(data, i)
	}
	return data, nil
}

// UpdateWeekPassed Call this periodically
func UpdateWeekPassed() {
	currentDate := time.Now().Format(time.DateOnly)
	_, err := DB.Exec("UPDATE "+weekTable+" SET has_passed = 1 WHERE week_of < ?", currentDate)
	if err != nil {
		log.Println(err.Error())
		panic("Error updating week_passed field")
	}
}

func InsertDevice(device DeviceRequestBody) error {
	_, err := DB.Exec("INSERT OR IGNORE INTO "+deviceTable+" "+
		"VALUES(NULL, ?)",
		device.Token)
	if err != nil {
		return err
	}

	return err
}

func RetrieveAllDevices() ([]Device, error) {
	rows, err := DB.Query("SELECT * FROM " + deviceTable)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var data []Device
	for rows.Next() {
		i := Device{}
		err = rows.Scan(&i.Id, &i.Token)
		if err != nil {
			return nil, err
		}
		data = append(data, i)
	}
	return data, nil
}

func DeleteDevice(token string) error {
	_, err := DB.Exec("DELETE FROM "+deviceTable+" WHERE token = ?", token)
	if err != nil {
		log.Println(err.Error())
	}
	return err
}

func RetrieveStatus() (string, error) {
	row := DB.QueryRow("SELECT last_updated FROM " + statusTable + " WHERE id = 1")
	var lastUpdated string
	err := row.Scan(&lastUpdated)
	log.Printf("Last updated on %s", lastUpdated)
	return lastUpdated, err
}

func UpdateStatusTime(lastUpdated string) error {
	_, err := DB.Exec("INSERT INTO "+statusTable+
		"(id, last_updated) VALUES(1, ?)"+
		"ON CONFLICT(id) DO UPDATE "+
		"SET last_updated = excluded.last_updated;",
		lastUpdated)

	return err
}
