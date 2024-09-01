package main

import (
	"log"
	"net/http"
	"os"

	"firebase.google.com/go/messaging"
	"github.com/jasonlvhit/gocron"
	"golang.org/x/net/context"
)

// Utilities

func ExecuteDailyJob() {
	gocron.Every(1).Days().Do(UpdateWeekPassed)
	<-gocron.Start()
	log.Println("Beginning daily job")
	gocron.Every(1).Week().Do(RunDailyScrape)
	<-gocron.Start()
	log.Println("Beginning weekly job")
}

func RunDailyScrape() {
	scraperServer := os.Getenv("SCRAPER_SERVER")
	http.Get(scraperServer + "/scrape")
}

func NotifyDevices(title string, body string) error {
	// Get devices and use firebase messaging to notify
	ctx := context.Background()
	client, err := APP.Messaging(ctx)
	if err != nil {
		return err
	}

	devices, err := RetrieveAllDevices()
	if err != nil {
		return err
	}
	tokens := make([]string, len(devices))
	for i, device := range devices {
		tokens[i] = device.Token
	}

	log.Println(tokens)

	message := &messaging.MulticastMessage{
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Tokens: tokens,
	}

	br, err := client.SendMulticast(ctx, message)
	if err != nil {
		log.Println(err.Error())
		return err
	}

	log.Printf("%d messages were sent successfully\n", br.SuccessCount)

	//if br.FailureCount > 0 {
	//	var failedTokens []string
	//	for idx, resp := range br.Responses {
	//		if !resp.Success {
	//			failedTokens = append(failedTokens, tokens[idx])
	//		}
	//	}
	//	// TODO: Delete all failed tokens from token db
	//	for _, token := range failedTokens {
	//		err := DeleteDevice(token)
	//		if err != nil {
	//			log.Println("Error deleting device token", err.Error())
	//		} else {
	//			log.Printf("Deleted token %s from database", token)
	//		}
	//	}
	//}

	return nil
}
