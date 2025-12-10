const socket = io();
let sessionId = null;
let isMaster = false;
let canGuess = false;

// DOM Elements
const homeDiv = document.getElementById("home");
const lobbyDiv = document.getElementById("lobby");
const gameDiv = document.getElementById("game");
const gameOverDiv = document.getElementById("game-over");

// Inputs
const lobbyQuestion = document.getElementById("lobby-question");
const lobbyAnswer = document.getElementById("lobby-answer");
const nextQuestion = document.getElementById("next-question");
const nextAnswer = document.getElementById("next-answer");
const gameQuestionDisplay = document.getElementById("game-question-display");
const guessInput = document.getElementById("guess-input");
const playerControls = document.getElementById("player-controls");

// Feedback
const nextRoundPanel = document.getElementById("next-round-panel");
const feedbackP = document.getElementById("feedback");
const timerP = document.getElementById("timer");


//  CONNECTION
document.getElementById("create-game-btn").onclick = () => {
  const name = document.getElementById("master-name").value.trim();
  if (!name) return alert("Enter your name");
  socket.emit("createGame", { name });
};

document.getElementById("join-game-btn").onclick = () => {
  const name = document.getElementById("player-name").value.trim();
  const id = document.getElementById("game-id-input").value.trim();
  if (!name || !id) return alert("Enter name and Game ID");
  socket.emit("joinGame", { sessionId: id, name });
};


// SERVER ERROR HANDLING 
socket.on("inputError", (msg) => {
  alert(msg);
});

socket.on("joinError", (msg) => {
  alert(msg);
});

socket.on("startError", (msg) => {
  alert(msg);
});


// GAME SETUP
socket.on("gameCreated", ({ sessionId: id }) => {
  sessionId = id;
  isMaster = true;
  showLobby();
});

socket.on("joinedGame", ({ sessionId: id }) => {
  sessionId = id;
  showLobby();
});

function showLobby() {
  homeDiv.style.display = "none";
  lobbyDiv.style.display = "block";
  gameDiv.style.display = "none";
  gameOverDiv.style.display = "none";

  document.getElementById("game-id-display").innerText = sessionId;

  if (isMaster) {
    document.getElementById("lobby-master-controls").style.display = "block";
  }
}


//LOBBY PLAYERS
socket.on("playersUpdated", (players) => {
  const list = document.getElementById("players-list");
  list.innerHTML = "";

  players.forEach((p) => {
    const li = document.createElement("li");
    li.innerHTML = `<b>${p.name}</b> ${p.isMaster ? "(Host)" : ""}`;
    list.appendChild(li);
  });
});


// GAME LOGIC
document.getElementById("start-game-btn").onclick = () => {
  const q = lobbyQuestion.value.trim();
  const a = lobbyAnswer.value.trim();
  if (!q || !a) return alert("Enter both question and answer");

  socket.emit("setAndStartRound", {
    sessionId,
    question: q,
    answer: a,
  });
};

document.getElementById("next-round-btn").onclick = () => {
  const q = nextQuestion.value.trim();
  const a = nextAnswer.value.trim();
  if (!q || !a) return alert("Enter both question and answer");

  socket.emit("setAndStartRound", {
    sessionId,
    question: q,
    answer: a,
  });

  nextQuestion.value = "";
  nextAnswer.value = "";
};

socket.on("roundStarted", ({ question, roundNumber }) => {
  lobbyDiv.style.display = "none";
  gameDiv.style.display = "block";

  document.getElementById("round-number").innerText = `Round ${roundNumber}`;
  gameQuestionDisplay.value = question;
  feedbackP.innerHTML = "";
  timerP.classList.remove("timer-warning");
  nextRoundPanel.style.display = "none";

  if (!isMaster) {
    playerControls.style.display = "block";
    guessInput.value = "";
    guessInput.disabled = false;
    document.getElementById("guess-btn").disabled = false;
    canGuess = true;
  } else {
    playerControls.style.display = "none";
  }
});

socket.on("timerUpdate", (time) => {
  timerP.innerText = `${time}s`;
  if (time <= 10) timerP.classList.add("timer-warning");
});

socket.on("roundEnded", ({ winner, answer }) => {
  canGuess = false;
  guessInput.disabled = true;
  document.getElementById("guess-btn").disabled = true;

  if (winner) {
    feedbackP.innerHTML = `
      <div class="winner-text">${winner} WON!</div>
      Answer: <b>${answer}</b>
    `;
  } else {
    feedbackP.innerHTML = `
      <div class="timeout-text">Time's up!</div>
      Answer: <b>${answer}</b>
    `;
  }

  if (isMaster) {
    nextRoundPanel.style.display = "block";
    nextQuestion.focus();
  }
});


// GUESSING
document.getElementById("guess-btn").onclick = () => {
  if (!canGuess) return;
  const guess = guessInput.value.trim();
  if (!guess) return;
  socket.emit("guess", { sessionId, guess });
};

socket.on("wrongGuess", (attempts) => {
  feedbackP.innerHTML = `
    <span class="wrong-text">Wrong!</span>
    ${attempts} attempts left.
  `;
});

socket.on("clearInput", () => {
  guessInput.value = "";
  guessInput.focus();
});


// LEADERBOARD
socket.on("dashboardUpdate", (players) => {
  const dash = document.getElementById("dashboard");
  dash.innerHTML = "";

  const competitors = players.filter((p) => !p.isMaster);
  const sorted = competitors.sort((a, b) => b.score - a.score);

  sorted.forEach((p, idx) => {
    const li = document.createElement("li");
    li.className = "dashboard-item";
    if (idx === 0 && p.score > 0) li.classList.add("leader");

    li.innerHTML = `
      <span>#${idx + 1} ${p.name}</span>
      <span style="font-weight:bold">${p.score} pts</span>
    `;
    dash.appendChild(li);
  });
});


// END GAME
window.endGameRequest = () => {
  if (confirm("End the game for everyone?")) {
    socket.emit("endGame", sessionId);
  }
};

socket.on("gameEnded", ({ players }) => {
  gameDiv.style.display = "none";
  lobbyDiv.style.display = "none";
  gameOverDiv.style.display = "block";

  const list = document.getElementById("final-leaderboard");
  list.innerHTML = "";

  const competitors = players.filter((p) => !p.isMaster);
  const sorted = competitors.sort((a, b) => b.score - a.score);

  sorted.forEach((p, idx) => {
    const li = document.createElement("li");
    li.className = "dashboard-item";

    const medal =
      idx === 0 ? "#1" : idx === 1 ? "#2" : idx === 2 ? "#3" : `#${idx + 1}`;

    li.innerHTML = `
      <span class="final-rank">
        <span class="medal">${medal}</span> ${p.name}
      </span>
      <span class="final-score">${p.score} pts</span>
    `;
    list.appendChild(li);
  });
});
