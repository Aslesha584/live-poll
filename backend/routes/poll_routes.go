package routes

import (
	"github.com/gin-gonic/gin"
	"live-poll-backend/controllers"
)

func PollRoutes(router *gin.Engine) {
	router.POST("/api/polls", controllers.CreatePoll)
	router.GET("/api/polls/:id", controllers.GetPoll)
	router.POST("/api/polls/:id/vote", controllers.VotePoll)
	router.GET("/api/polls/:id/ws", controllers.PollWebSocket)
}