package routes

import (
	"github.com/gin-gonic/gin"
	"live-poll-backend/controllers"
)

func AuthRoutes(router *gin.Engine) {
	auth := router.Group("/api/auth")

	auth.POST("/signup", controllers.Signup)
	auth.POST("/login", controllers.Login)
}