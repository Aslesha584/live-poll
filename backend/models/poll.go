package models

import "time"

type Poll struct {
	ID        interface{} `bson:"_id,omitempty" json:"id"`
	Question  string      `bson:"question" json:"question"`
	Options   []string    `bson:"options" json:"options"`
	Votes     []int       `bson:"votes" json:"votes"`
	CreatedAt time.Time   `bson:"createdAt" json:"createdAt"`
}