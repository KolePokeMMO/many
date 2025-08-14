import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  update,
  remove,
  onDisconnect,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBVbb67rvWjdY279rAo8BEyPTNKZVGqfIY",
  authDomain: "sl-rps.firebaseapp.com",
  databaseURL: "https://sl-rps-default-rtdb.firebaseio.com",
  projectId: "sl-rps",
  storageBucket: "sl-rps.firebasestorage.app",
  messagingSenderId: "670763987872",
  appId: "1:670763987872:web:7dd535b257065e9fd82ac5"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const appDiv = document.getElementById("rps-app");

// Determine winner for Grass/Fire/Water
function determineWinner(p1, p2) {
  if (p1 === p2) return null;
  if (
    (p1 === "grass" && p2 === "water") ||
    (p1 === "fire" && p2 === "grass") ||
    (p1 === "water" && p2 === "fire")
  ) return 0;
  return 1;
}

// Get room name from URL hash
function getRoomName() {
  // Expect format: #/room/ROOMNAME
  const hash = window.location.hash;
  if (!hash.startsWith("#/room/")) return null;
  return decodeURIComponent(hash.split("/")[2] || "");
}

// Navigate to room using hash
function initFrontPage() {
  const createBtn = document.getElementById("create-room-btn");
  createBtn.addEventListener("click", () => {
    const name = document.getElementById("player-name-input").value.trim();
    const room = document.getElementById("room-id-input").value.trim();
    if (!name || !room) return alert("Enter both name and room.");
    localStorage.setItem(`rps-player-name-${room}`, name);
    // Use hash instead of query param
    window.location.hash = `/room/${encodeURIComponent(room)}`;
    // Trigger room load
    showRoomUI(room);
  });
}


// Show room UI
async function showRoomUI(room) {
  const playerIdKey = `rps-player-id-${room}`;
  const playerNameKey = `rps-player-name-${room}`;
  let playerId = localStorage.getItem(playerIdKey) || crypto.randomUUID();
  localStorage.setItem(playerIdKey, playerId);

  let playerName = localStorage.getItem(playerNameKey);
  while (!playerName) {
    playerName = prompt("Enter your Trainer Name:").trim();
    if (playerName) localStorage.setItem(playerNameKey, playerName);
  }

  // Show UI
  document.getElementById("rps-ui").style.display = "block";
  document.getElementById("room-title").textContent = `Room: ${room}`;

  const choicesBtns = document.querySelectorAll(".rps-choices button");
  const youChoiceEl = document.getElementById("you-choice");
  const opponentChoiceEl = document.getElementById("opponent-choice");
  const roundResultEl = document.getElementById("round-result");
  const historyList = document.getElementById("game-history");
  const scoreboardEl = document.getElementById("scoreboard");

  const playersRef = ref(db, `rps/rooms/${room}/players`);
  const currentRoundRef = ref(db, `rps/rooms/${room}/currentRound`);
  const historyRef = ref(db, `rps/rooms/${room}/history`);

  const playerRef = ref(db, `rps/rooms/${room}/players/${playerId}`);
  set(playerRef, { name: playerName, choice: null, score: 0 });
  onDisconnect(playerRef).remove();

  let roundActive = true;

  // Choice click
  choicesBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!roundActive) return;
      const choice = btn.dataset.choice;
      set(playerRef, { name: playerName, choice, score: 0 });
      youChoiceEl.textContent = choice;
      roundResultEl.textContent = "-";
    });
  });

  // Play Again button
  document.getElementById("play-again-btn").addEventListener("click", () => {
    set(playerRef, { name: playerName, choice: null, score: 0 });
    youChoiceEl.textContent = "-";
    opponentChoiceEl.textContent = "-";
    roundResultEl.textContent = "-";
    roundActive = true;
  });

  // Copy link
  document.getElementById("copy-link-btn").addEventListener("click", () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert("Room link copied!"))
      .catch(() => alert("Copy manually."));
  });

  // Listen for players changes
  onValue(playersRef, async (snap) => {
    const players = snap.val() || {};
    const keys = Object.keys(players);
    if (keys.length < 2) {
      roundResultEl.textContent = "Waiting for opponent...";
      opponentChoiceEl.textContent = "-";
      return;
    }

    const yourChoice = players[playerId]?.choice;
    const opponentKey = keys.find(k => k !== playerId);
    const opponentChoice = players[opponentKey]?.choice;

    opponentChoiceEl.textContent = opponentChoice || "-";

    if (!yourChoice || !opponentChoice) return;

    // Determine winner
    const winnerIndex = determineWinner(yourChoice, opponentChoice);
    let resultText = winnerIndex === null ? "Tie!" : winnerIndex === 0 ? "You win!" : "You lose!";
    roundResultEl.textContent = resultText;
    roundActive = false;

    // Update scores & history
    const updates = {};
    if (!players[playerId].score) players[playerId].score = 0;
    if (!players[opponentKey].score) players[opponentKey].score = 0;

    if (winnerIndex === 0) updates[`${playerId}/score`] = players[playerId].score + 1;
    if (winnerIndex === 1) updates[`${opponentKey}/score`] = players[opponentKey].score + 1;

    update(playersRef, updates);

    // Push to history
    push(historyRef, {
      player1: players[playerId].name,
      player1Choice: yourChoice,
      player2: players[opponentKey].name,
      player2Choice: opponentChoice,
      winner: winnerIndex === null ? "Tie" : winnerIndex === 0 ? players[playerId].name : players[opponentKey].name,
      timestamp: Date.now()
    });
  });

  // Update history
  onValue(historyRef, (snap) => {
    const history = snap.val() || {};
    historyList.innerHTML = "";
    Object.values(history)
      .sort((a,b) => b.timestamp - a.timestamp)
      .forEach(entry => {
        const li = document.createElement("li");
        li.textContent = `${entry.player1}(${entry.player1Choice}) vs ${entry.player2}(${entry.player2Choice}) → ${entry.winner}`;
        historyList.appendChild(li);
      });
  });

  // Update scoreboard
  onValue(playersRef, (snap) => {
    const players = snap.val() || {};
    scoreboardEl.innerHTML = "";
    Object.values(players).forEach(p => {
      const li = document.createElement("li");
      li.textContent = `${p.name}: ${p.score || 0} pts`;
      scoreboardEl.appendChild(li);
    });
  });
}

// Initialize
const roomName = getRoomName();
if (!roomName) {
  initFrontPage();
} else {
  showRoomUI(roomName);
}

// SPA init
function initApp() {
  const roomName = getRoomName();
  if (!roomName) {
    initFrontPage();
  } else {
    showRoomUI(roomName);
  }
}

// Listen to hash changes (dynamic room navigation)
window.addEventListener("hashchange", () => {
  const roomName = getRoomName();
  if (roomName) showRoomUI(roomName);
});

// Start app
initApp();
