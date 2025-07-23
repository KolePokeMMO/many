// rps.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  get,
  remove // <-- ADD THIS
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

// Helper to get room name from URL (?room=xxx)
function getRoomName() {
  const params = new URLSearchParams(window.location.search);
  return params.get("room");
}

// UI Setup
const appDiv = document.getElementById("rps-app");

// Show room creation form
function createRoomForm() {
  appDiv.innerHTML = `
    <div class="rps-create-room">
      <input type="text" id="room-name-input" placeholder="Enter a room name" />
      <button id="join-room-btn">Create Room</button>
    </div>
  `;

  document.getElementById("join-room-btn").addEventListener("click", () => {
    const name = document.getElementById("room-name-input").value.trim();
    if (name) {
      window.location.href = `/many/utilities/rps/?room=${encodeURIComponent(name)}`;
    }
  });
}

// Show the game UI for a given room
function showGameUI(room) {
  appDiv.innerHTML = `
    <div class="rps-game">
      <h2>Room: ${room}</h2>
      <button id="copy-link">Copy Room Link</button>
      <div class="rps-buttons">
        <button data-choice="rock">🪨 Rock</button>
        <button data-choice="paper">📄 Paper</button>
        <button data-choice="scissors">✂️ Scissors</button>
      </div>
      <p>You chose: <span id="you">-</span></p>
      <p>Opponent chose: <span id="opp">-</span></p>
      <p>Result: <strong id="result">-</strong></p>
      <div id="rps-status"></div>
    </div>
  `;

  // Copy room link button
  document.getElementById("copy-link").addEventListener("click", () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert("Room link copied to clipboard!");
    });
  });

  // Manage player ID in localStorage
  const playerId = localStorage.getItem("rps-player-id") || crypto.randomUUID();
  localStorage.setItem("rps-player-id", playerId);

  // Player choice buttons
  document.querySelectorAll(".rps-buttons button").forEach(btn => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.choice;
      set(ref(db, `rps/rooms/${room}/players/${playerId}`), {
        choice: choice,
        timestamp: Date.now()
      });
      document.getElementById('you').textContent = choice;
      document.getElementById('result').textContent = "-";
      document.getElementById('opp').textContent = "-";
      document.getElementById('rps-status').textContent = "Waiting for opponent...";
    });
  });

  // Listen for opponent's move and update UI live
  const roomRef = ref(db, `rps/rooms/${room}/players`);
onValue(roomRef, snapshot => {
  const players = snapshot.val();

  console.log("Players data from Firebase:", players);
  console.log("Current player ID:", playerId);

  if (!players || Object.keys(players).length < 2) {
    document.getElementById("rps-status").textContent = "Waiting for second player...";
    document.getElementById("opp").textContent = "-";
    document.getElementById("result").textContent = "-";
    return;
  }

  const playerKeys = Object.keys(players);
  console.log("Player keys:", playerKeys);

  const opponentKey = playerKeys.find(k => k !== playerId);
  if (!opponentKey) {
    document.getElementById("rps-status").textContent = "Waiting for opponent to join...";
    document.getElementById("opp").textContent = "-";
    document.getElementById("result").textContent = "-";
    return;
  }

  // Set choices safely
const yourChoice = players[playerId]?.choice || "-";
const opponentChoice = players[opponentKey]?.choice || "-";

document.getElementById("you").textContent = yourChoice;
document.getElementById("opp").textContent = opponentChoice;

if (yourChoice === "-" && opponentChoice === "-") {
  document.getElementById("result").textContent = "-";
  document.getElementById("rps-status").textContent = "Waiting for both players to choose...";
} else if (yourChoice === "-") {
  document.getElementById("result").textContent = "-";
  document.getElementById("rps-status").textContent = "Waiting for you to choose...";
} else if (opponentChoice === "-") {
  document.getElementById("result").textContent = "-";
  document.getElementById("rps-status").textContent = "Waiting for opponent to choose...";
} else {
  const result = getWinner(yourChoice, opponentChoice, playerId === playerKeys[0]);
  document.getElementById("result").textContent = result;
  document.getElementById("rps-status").textContent = `Player 1 chose ${players[playerKeys[0]].choice}, Player 2 chose ${players[playerKeys[1]].choice}`;

  // Auto-reset game state after 5 seconds
  setTimeout(() => {
    remove(ref(db, `rps/rooms/${room}/players`));
  }, 5000);
}


});

}

// Determine winner, taking into account if current player is player 1 or 2
function getWinner(p1, p2, isPlayer1) {
  if (p1 === p2) return "Draw!";
  const p1Wins = (p1 === "rock" && p2 === "scissors") ||
                 (p1 === "paper" && p2 === "rock") ||
                 (p1 === "scissors" && p2 === "paper");
  if (p1Wins) return isPlayer1 ? "You win!" : "You lose!";
  else return isPlayer1 ? "You lose!" : "You win!";
}

// Main entry point
const roomName = getRoomName();
if (!roomName || roomName.toLowerCase() === "rps") {
  createRoomForm();
} else {
  showGameUI(roomName);
}
