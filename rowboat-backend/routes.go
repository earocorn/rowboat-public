package main

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// Endpoints

func GetWeeks(c *gin.Context) {
	data, err := RetrieveAllWeeks()
	if err != nil {
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"message": "No weeks available"})
		return
	}

	c.IndentedJSON(http.StatusOK, data)
}

func GetDaysByWeekId(c *gin.Context) {
	weekId := c.Param("id")
	parsedId, err := strconv.ParseInt(weekId, 10, 64)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "Invalid parameter value"})
		return
	}

	data, retrieveErr := RetrieveAllDaysByWeekId(parsedId)
	if retrieveErr != nil {
		c.AbortWithStatusJSON(http.StatusNoContent, gin.H{"message": retrieveErr.Error()})
		return
	}

	c.IndentedJSON(http.StatusOK, data)
}

func PostSchedule(c *gin.Context) {
	var requestBody WeekRequestBody
	bindErr := c.BindJSON(&requestBody)
	if bindErr != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "Invalid request body"})
		return
	}

	weekOfDate, dateParseErr := time.Parse(time.DateOnly, requestBody.WeekOf)
	if dateParseErr != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "Invalid week_of date format. Please use YYY-MM-DD"})
		return
	}

	weekPassed := time.Now().After(weekOfDate)
	newWeek := ScheduledWeek{
		WeekOf:     requestBody.WeekOf,
		HasPassed:  weekPassed,
		TotalHours: requestBody.TotalHours,
	}
	newWeekId, insertErr := InsertWeek(newWeek)
	if insertErr != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "Error updating week"})
		log.Println(insertErr.Error())
		return
	}

	if bulkInsertErr := InsertDays(requestBody.Days, newWeekId); bulkInsertErr != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "Error parsing days"})
		log.Println(bulkInsertErr.Error())
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"message": "Successfully posted scheduled"})
}

func PatchDayById(c *gin.Context) {
	dayId := c.Param("id")
	parsedId, err := strconv.ParseInt(dayId, 10, 64)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "Invalid parameter value"})
		return
	}

	var requestBody DayPatchBody
	bindErr := c.BindJSON(&requestBody)
	if bindErr != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "Invalid request body"})
		return
	}

	day := ScheduledDay{
		DayId:      parsedId,
		WeekId:     0,
		Date:       "",
		StartTime:  requestBody.StartTime,
		EndTime:    requestBody.EndTime,
		ShiftHours: 0,
		AltDept:    requestBody.AltDept,
	}

	_, err = PatchDay(day)
	if err != nil {
		log.Println(err.Error())
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "Error updating day"})
		return
	}
	c.IndentedJSON(http.StatusOK, gin.H{"message": "Successfully updated day"})
}

func RequestRunScraper(c *gin.Context) {
	scraperServer := os.Getenv("SCRAPER_SERVER")
	resp, err := http.Get(scraperServer + "/scrape")
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "Error requesting scraper server"})
		return
	}
	if resp.StatusCode != 200 {
		c.AbortWithStatusJSON(http.StatusTooEarly, gin.H{"message": "Data is currently being fetched. Please wait"})
		return
	}
	defer resp.Body.Close()

	c.IndentedJSON(http.StatusOK, gin.H{"message": "Queued up web scraper"})
}

func UpdateScraperStatus(c *gin.Context) {
	var requestBody ScraperStatusRequestBody
	bindErr := c.BindJSON(&requestBody)
	if bindErr != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "Invalid request body"})
		return
	}
	if !requestBody.IsComplete {
		// Notify all devices
		notifyErr := NotifyDevices("Failure", "Schedules could not be updated 😔")
		if notifyErr != nil {
			c.AbortWithStatusJSON(http.StatusExpectationFailed, gin.H{"message": notifyErr.Error()})
			return
		}

		c.IndentedJSON(http.StatusOK, gin.H{"message": "Scraper did not finish job"})
		return
	}

	statusUpdateErr := UpdateStatusTime(requestBody.LastUpdated)
	if statusUpdateErr != nil {
		c.AbortWithStatusJSON(http.StatusExpectationFailed, gin.H{"message": statusUpdateErr.Error()})
		return
	}

	// Notify all devices
	notifyErr := NotifyDevices("Success", "Your schedules have been updated!")
	if notifyErr != nil {
		c.AbortWithStatusJSON(http.StatusExpectationFailed, gin.H{"message": notifyErr.Error()})
		return
	}
	c.IndentedJSON(http.StatusOK, gin.H{"message": "Notifications have been served"})
}

func GetScraperStatus(c *gin.Context) {
	lastUpdated, err := RetrieveStatus()
	if err != nil {
		c.AbortWithStatusJSON(http.StatusNoContent, gin.H{"message": err.Error()})
		return
	}
	c.IndentedJSON(http.StatusOK, gin.H{
		"message":      "Status retrieved",
		"last_updated": lastUpdated})
}

func AddDevice(c *gin.Context) {
	var requestBody DeviceRequestBody
	bindErr := c.BindJSON(&requestBody)
	if bindErr != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "Invalid request body"})
		return
	}

	insertErr := InsertDevice(requestBody)
	if insertErr != nil {
		c.AbortWithStatusJSON(http.StatusConflict, gin.H{"message": "There was a problem accepting device"})
		return
	}
	c.IndentedJSON(http.StatusOK, gin.H{"message": "Successfully registered device"})
}

// Middleware

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func PrivateMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "localhost")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
