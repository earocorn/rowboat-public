package main

// Database schemas

type ScheduledWeek struct {
	WeekId     int64   `json:"week_id"`
	WeekOf     string  `json:"week_of"` // Unique
	HasPassed  bool    `json:"has_passed"`
	TotalHours float32 `json:"total_hours"`
}

type ScheduledDay struct {
	DayId           int64   `json:"day_id"`
	WeekId          int64   `json:"week_id"` // Foreign key referencing scheduled_week
	Date            string  `json:"date"`    // Unique
	StartTime       string  `json:"start_time"`
	EndTime         string  `json:"end_time"`
	ShiftHours      float32 `json:"shift_hours"`
	AltDept         string  `json:"alt_dept"`
	ManuallyChanged bool    `json:"manually_changed"`
}

type Device struct {
	Id    int64  `json:"id"`
	Token string `json:"token"`
}

// HTTP request bodies

// DayRequestBody POST Day
type DayRequestBody struct {
	Date       string  `json:"date"`
	StartTime  string  `json:"start_time"`
	EndTime    string  `json:"end_time"`
	ShiftHours float32 `json:"shift_hours"`
	AltDept    string  `json:"alt_dept"`
}

// WeekRequestBody POST Week
type WeekRequestBody struct {
	Days       []DayRequestBody `json:"days"`
	WeekOf     string           `json:"week_of"`
	TotalHours float32          `json:"total_hours"`
}

// DayPatchBody PATCH Day
type DayPatchBody struct {
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	AltDept   string `json:"alt_dept"`
}

type DeviceRequestBody struct {
	Token string `json:"token"`
}

// ScraperStatusRequestBody Update status
type ScraperStatusRequestBody struct {
	IsComplete  bool   `json:"is_complete"`
	LastUpdated string `json:"last_updated"`
}
