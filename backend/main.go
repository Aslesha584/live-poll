package main

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"live-poll-backend/config"
	"live-poll-backend/routes"
	"live-poll-backend/services"
)

func main() {
	config.ConnectMongoDB()
	config.ConnectRedis()

	services.StartRedisSubscriber()

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"OPTIONS",
		},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Authorization",
		},
	}))

	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Live Poll API is running!",
		})
	})

	routes.AuthRoutes(router)
	routes.PollRoutes(router)

	router.Run(":5000")
}