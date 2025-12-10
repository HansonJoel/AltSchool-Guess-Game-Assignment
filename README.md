# Real-Time Guessing Game (AltSchool Assignment)

## Project Overview

This project is a **real-time multiplayer guessing game** built with **Node.js**, **Express**, and **Socket.IO**.  
One user acts as the **Game Master**, while others join as **Players** to answer questions in a live, chat-like game session.

The application emphasizes **real-time communication**, **server-side validation**, and **proper game-state management**.

---

## Features

### Game Session Management

- A player can create a game session and become the **Game Master**
- Other players can join using a **Game ID**
- Live player list updates for all users

### Game Rules Enforcement

- A game **cannot start unless the minimum number of players is met**
- The **Game Master cannot answer questions**
- Only **one active round** can exist at a time
- A new round can only start **after the current round ends**

### Real-Time Gameplay

- Questions and answers are managed by the Game Master
- Players submit guesses in real time
- Correct answers immediately end the round
- If time runs out:
  - The correct answer is revealed
  - No points are awarded

### Scoring System

- Players earn 10 points for correct answers
- Scores update live for all players
- Final leaderboard is shown when the game ends

### Robust Validation & Error Handling

- Centralized server-side input validation
- Clear error messages for:
  - Invalid input
  - Joining invalid sessions
  - Starting a game without enough players

## Technologies Used

- **Node.js** – Server runtime
- **Express.js** – Web framework
- **Socket.IO** – Real-time bidirectional communication
- **HTML, CSS, JavaScript** – Frontend interface

## Project Structure

project-root/
│
├── controllers/
│ └── gameController.js
│
├── models/
│ ├── GameSession.js
│ └── Player.js
│
├── utils/
│ └── validation.js
│
├── public/
│ ├── css/
│ └── js/
│ └── script.js
│
├── views/
│ └── index.html
│
├── server.js
└── package.json

## How the Game Works

1. A user creates a game and becomes the **Game Master**
2. Other players join using the generated **Game ID**
3. Once enough players have joined, the Game Master starts the game
4. Players submit guesses in real time
5. The round ends when:
   - A player answers correctly, or
   - The timer expires
6. The Game Master starts the next round
7. The game can be ended at any time, displaying the final leaderboard

## Key Learning Outcomes

Implementing real-time applications with Socket.IO

Managing shared state across multiple users

Enforcing rules with server-side validation

Structuring a Node.js project for maintainability

Handling real-time events and edge cases correctly

# Author

Joel Hanson
AltSchool Africa – Backend Engineering Track
