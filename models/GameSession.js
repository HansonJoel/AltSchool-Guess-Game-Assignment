const Player = require("./player");
const {
  validateInput,
  validateMinPlayers,
} = require("../utils/validation");

class GameSession {
  constructor(id, masterId, masterName) {
    this.id = id;
    this.players = [];
    this.gameMaster = masterId;
    this.currentQuestion = null;
    this.currentAnswer = null;
    this.gameStarted = false;
    this.roundActive = false;
    this.timer = null;
    this.timeLeft = 30;
    this.roundNumber = 0;

    this.addPlayer(masterId, masterName, true);
  }

  addPlayer(id, name, isMaster = false) {
    if (!validateInput(name)) return;
    const player = new Player(id, name, isMaster);
    this.players.push(player);
  }

  removePlayer(id) {
    this.players = this.players.filter((p) => p.id !== id);

    if (this.gameMaster === id && this.players.length > 0) {
      this.players[0].isMaster = true;
      this.gameMaster = this.players[0].id;
    }
  }

  setQuestion(question, answer) {
    if (!validateInput(question) || !validateInput(answer)) {
      return false;
    }

    this.currentQuestion = question;
    this.currentAnswer = answer;

    this.players.forEach((p) => {
      if (!p.isMaster) p.attempts = 3;
    });

    this.timeLeft = 30;
    return true;
  }

  startRound(io) {
    // ✅ Require at least 2 players (excluding the master)
    const nonMasterPlayers = this.players.filter((p) => !p.isMaster);

    if (!validateMinPlayers(nonMasterPlayers, 2)) {
      io.to(this.gameMaster).emit(
        "startError",
        "At least 2 players are required to start the game."
      );
      return;
    }

    if (!this.currentQuestion || !this.currentAnswer) return;

    this.gameStarted = true;
    this.roundActive = true;
    this.roundNumber++;

    if (this.timer) clearInterval(this.timer);

    io.to(this.id).emit("roundStarted", {
      question: this.currentQuestion,
      roundNumber: this.roundNumber,
    });

    io.to(this.id).emit("dashboardUpdate", this.getPlayers());

    this.timeLeft = 30;

    this.timer = setInterval(() => {
      this.timeLeft--;
      io.to(this.id).emit("timerUpdate", this.timeLeft);

      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.roundActive = false;

        io.to(this.id).emit("roundEnded", {
          answer: this.currentAnswer,
          winner: null,
        });

        io.to(this.id).emit("dashboardUpdate", this.getPlayers());
      }
    }, 1000);
  }

  handleGuess(io, playerId, guess) {
    if (!validateInput(guess)) {
      return io.to(playerId).emit("noAnswer");
    }

    const player = this.players.find((p) => p.id === playerId);
    if (!player || player.attempts <= 0 || !this.roundActive || player.isMaster)
      return;

    player.attempts--;
    io.to(playerId).emit("clearInput");

    if (guess.toLowerCase() === this.currentAnswer.toLowerCase()) {
      player.score += 10;
      clearInterval(this.timer);
      this.roundActive = false;

      io.to(this.id).emit("roundEnded", {
        winner: player.name,
        answer: this.currentAnswer,
      });

      io.to(this.id).emit("dashboardUpdate", this.getPlayers());
    } else {
      io.to(playerId).emit("wrongGuess", player.attempts);
      io.to(this.id).emit("dashboardUpdate", this.getPlayers());
    }
  }

  getPlayers() {
    return this.players.map((p) => ({
      name: p.name,
      score: p.score,
      attempts: p.attempts,
      isMaster: p.isMaster,
    }));
  }

  endGame(io) {
    if (this.timer) clearInterval(this.timer);
    this.gameStarted = false;
    this.roundActive = false;
    io.to(this.id).emit("gameEnded", { players: this.getPlayers() });
  }
}

module.exports = GameSession;
