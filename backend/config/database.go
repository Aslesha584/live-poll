package config

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var DB *mongo.Database

func ConnectMongoDB() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found")
	}

	uri := os.Getenv("MONGO_URI")

	if uri == "" {
		log.Fatal("MONGO_URI is not set")
	}

	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal("MongoDB connection failed:", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal("MongoDB ping failed:", err)
	}

	DB = client.Database("livepoll")

	log.Println("MongoDB connected successfully")
}