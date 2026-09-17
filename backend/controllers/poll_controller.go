package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"

	"live-poll-backend/config"
	"live-poll-backend/models"
)

func CreatePoll(c *gin.Context) {
	var input struct {
		Question string   `json:"question"`
		Options  []string `json:"options"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if input.Question == "" || len(input.Options) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Question and at least 2 options are required",
		})
		return
	}

	poll := models.Poll{
		Question:  input.Question,
		Options:   input.Options,
		Votes:     make([]int, len(input.Options)),
		CreatedAt: time.Now(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := config.DB.Collection("polls").InsertOne(ctx, poll)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Could not create poll",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Poll created successfully",
		"pollId":  result.InsertedID,
	})
}

func GetPoll(c *gin.Context) {
	id := c.Param("id")

	objectID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID"})
		return
	}

	var poll models.Poll

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = config.DB.Collection("polls").FindOne(
		ctx,
		bson.M{"_id": objectID},
	).Decode(&poll)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	}

	c.JSON(http.StatusOK, poll)
}

func VotePoll(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		Option int `json:"option"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	objectID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get poll first so we can validate the option
	var poll models.Poll

	err = config.DB.Collection("polls").FindOne(
		ctx,
		bson.M{"_id": objectID},
	).Decode(&poll)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	}

	if input.Option < 0 || input.Option >= len(poll.Options) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid option"})
		return
	}

	// Add vote
	_, err = config.DB.Collection("polls").UpdateOne(
		ctx,
		bson.M{"_id": objectID},
		bson.M{
			"$inc": bson.M{
				"votes." + fmt.Sprint(input.Option): 1,
			},
		},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Could not record vote",
		})
		return
	}

	// Get updated poll
	err = config.DB.Collection("polls").FindOne(
		ctx,
		bson.M{"_id": objectID},
	).Decode(&poll)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Could not get updated poll",
		})
		return
	}

	// Send updated poll through Redis
	event := gin.H{
		"type":     "poll_update",
		"pollId":   id,
		"question": poll.Question,
		"options":  poll.Options,
		"votes":    poll.Votes,
	}

	eventBytes, _ := json.Marshal(event)

	if config.RedisClient != nil {
		config.RedisClient.Publish(
			ctx,
			"poll:"+id,
			eventBytes,
		)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vote recorded",
	})
}