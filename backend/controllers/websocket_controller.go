package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"live-poll-backend/services"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func PollWebSocket(c *gin.Context) {
	pollID := c.Param("id")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	services.AddClient(conn, pollID)
	defer services.RemoveClient(conn)

	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}