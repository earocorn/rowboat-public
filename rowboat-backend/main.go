package main

import (
	"database/sql"
	firebase "firebase.google.com/go"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/net/context"
	"log"
	"os"
)

var DB *sql.DB
var APP *firebase.App

func main() {
	// Load env
	envErr := godotenv.Load()
	if envErr != nil {
		fmt.Println(envErr.Error())
	}

	// Connect to SQLite database
	err := ConnectDatabase()
	if err != nil {
		panic("Error connecting to database" + err.Error())
	}

	// Do daily tasks
	go ExecuteDailyJob()

	app, err := firebase.NewApp(context.Background(), nil)
	if err != nil {
		log.Fatalf("error initializing app: %v\n", err)
	}
	APP = app

	// Init server
	router := gin.Default()
	// Privatize the use of status updates to the scraper itself
	router.Use(PrivateMiddleware())
	router.POST("/scrape/status", UpdateScraperStatus)
	// Allow everyone else to make requests
	router.Use(CORSMiddleware())
	router.POST("/device", AddDevice)
	router.POST("/scrape", RequestRunScraper)
	router.GET("/scrape/status", GetScraperStatus)
	router.GET("/weeks", GetWeeks)
	router.GET("/weeks/:id", GetDaysByWeekId)
	router.POST("/weeks", PostSchedule)
	router.PATCH("/days/:id", PatchDayById)

	router.Run("0.0.0.0:" + os.Getenv("PORT"))
	defer DB.Close()
}
