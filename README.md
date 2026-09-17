# Live Poll

A real-time live polling application where users can create polls, share them with an audience, and see voting results update instantly without refreshing the page.

This project was developed as part of the HCL GUVI Full Stack Development Intern Developer Task.

## Live Demo

Live Application:
https://live-poll-33aq.onrender.com

GitHub Repository:
https://github.com/Aslesha584/live-poll

## Features

- User signup and login
- JWT-based authentication
- Create polls with multiple options
- Backend input validation
- Share polls using a poll ID/link
- Audience can vote on polls
- Real-time vote/result updates without page refresh
- Poll results displayed with vote counts and percentages
- Responsive React frontend
- MongoDB for persistent poll and user data
- Redis Pub/Sub for real-time event communication
- WebSockets for delivering live updates to connected clients

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Go
- Gin Framework
- JWT
- bcrypt
- WebSockets

### Database
- MongoDB Atlas

### Realtime
- Redis Cloud
- Redis Pub/Sub
- WebSockets

### Deployment
- Render

## Project Structure


live-poll/
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── main.go
│   ├── go.mod
│   └── ...
│
└── README.md