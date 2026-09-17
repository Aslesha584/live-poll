package services

import (
	"context"
	"encoding/json"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
	"live-poll-backend/config"
)

var (
	Clients = make(map[*websocket.Conn]string)
	Mutex   sync.Mutex
)

func AddClient(conn *websocket.Conn, pollID string) {
	Mutex.Lock()
	defer Mutex.Unlock()
	Clients[conn] = pollID
}

func RemoveClient(conn *websocket.Conn) {
	Mutex.Lock()
	defer Mutex.Unlock()
	delete(Clients, conn)
	conn.Close()
}

func Broadcast(pollID string, message interface{}) {
	Mutex.Lock()
	defer Mutex.Unlock()

	for conn, clientPollID := range Clients {
		if clientPollID == pollID {
			conn.WriteJSON(message)
		}
	}
}

func StartRedisSubscriber() {
	go func() {
		if config.RedisClient == nil {
			return
		}

		pubsub := config.RedisClient.PSubscribe(
			context.Background(),
			"poll:*",
		)
		defer pubsub.Close()

		for msg := range pubsub.Channel() {
			var event interface{}

			if err := json.Unmarshal([]byte(msg.Payload), &event); err != nil {
				continue
			}

			parts := strings.SplitN(msg.Channel, ":", 2)

			if len(parts) == 2 {
				Broadcast(parts[1], event)
			}
		}
	}()
}