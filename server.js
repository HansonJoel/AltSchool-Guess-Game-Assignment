require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const gameRoutes = require("./routes/gameRoutes");
const { validateInput } = require("./utils/validation");
const GameSession = require("./models/GameSession");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));
app.use("/", gameRoutes);

const sessions = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("createGame", ({ name }) => {
    if (!validateInput(name)) {
      return socket.emit("inputError", "Invalid name");
    }

    const sessionId = Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase();

    const session = new GameSession(sessionId, socket.id, name);
    sessions[sessionId] = session;

    socket.join(sessionId);
    socket.emit("gameCreated", { sessionId });
  });

  socket.on("joinGame", ({ sessionId, name }) => {
    if (!validateInput(name) || !validateInput(sessionId)) {
      return socket.emit("joinError", "Invalid input");
    }

    const session = sessions[sessionId];
    if (!session) return socket.emit("joinError", "Invalid Game ID");
    if (session.gameStarted)
      return socket.emit("joinError", "Game already started");

    session.addPlayer(socket.id, name);
    socket.join(sessionId);

    io.to(sessionId).emit("playersUpdated", session.getPlayers());
    socket.emit("joinedGame", { sessionId });
  });

  socket.on("setAndStartRound", ({ sessionId, question, answer }) => {
    const session = sessions[sessionId];
    if (!session) return;

    const isValid = session.setQuestion(question, answer);
    if (!isValid) {
      return socket.emit("inputError", "Invalid question or answer");
    }

    session.startRound(io);
  });

  socket.on("guess", ({ sessionId, guess }) => {
    const session = sessions[sessionId];
    if (!session) return;
    session.handleGuess(io, socket.id, guess);
  });

  socket.on("endGame", (sessionId) => {
    const session = sessions[sessionId];
    if (!session) return;
    session.endGame(io);
    delete sessions[sessionId];
  });

  socket.on("disconnect", () => {
    Object.keys(sessions).forEach((id) => {
      const session = sessions[id];
      session.removePlayer(socket.id);

      if (session.players.length === 0) delete sessions[id];
      else io.to(id).emit("playersUpdated", session.getPlayers());
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
