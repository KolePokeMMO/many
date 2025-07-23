// rps.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, onValue, get, child } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBVbb67rvWjdY279rAo8BEyPTNKZVGqfIY",
    authDomain: "sl-rps.firebaseapp.com",
    projectId: "sl-rps",
    storageBucket: "sl-rps.firebasestorage.app",
    messagingSenderId: "670763987872",
    appId: "1:670763987872:web:7dd535b257065e9fd82ac5"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Helper to get room name from URL
function getRoomName() {
  const params = new URLSearchParams(window.location.search);
  return params.get("room");
}

// UI Setup
const appDiv = document.getElementById("rps-app");

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

function showGameUI(room) {
  appDiv.innerHTML = `
    <h2>Room: ${room}</h2>
    <button id="copy-link">Copy Room Name</button>
    <div class="rps-choices">
      <button data-choice="rock">🪨 Rock</button>
      <button data-choice="paper">📄 Paper</button>
      <button data-choice="scissors">✂️ Scissors</button>
    </div>
    <div id="rps-status"></div>
  `;

  document.getElementById("copy-link").addEventListener("click", () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert("Room name copied to clipboard!");
    });
  });

  document.querySelectorAll(".rps-choices button").forEach(btn => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.choice;
      const playerId = localStorage.getItem("rps-player-id") || crypto.randomUUID();
      localStorage.setItem("rps-player-id", playerId);

      set(ref(db, `rps/rooms/${room}/players/${playerId}`), {
        choice: choice,
        timestamp: Date.now()
      });
    });
  });

  const statusDiv = document.getElementById("rps-status");
  const roomRef = ref(db, `rps/rooms/${room}/players`);
  onValue(roomRef, snapshot => {
    const players = snapshot.val();
    if (players && Object.keys(players).length === 2) {
      const [p1, p2] = Object.values(players);
      const result = getWinner(p1.choice, p2.choice);
      statusDiv.textContent = `P1: ${p1.choice}, P2: ${p2.choice} → ${result}`;
    } else {
      statusDiv.textContent = "Waiting for second player...";
    }
  });
}

function getWinner(p1, p2) {
  if (p1 === p2) return "Draw!";
  if (
    (p1 === "rock" && p2 === "scissors") ||
    (p1 === "paper" && p2 === "rock") ||
    (p1 === "scissors" && p2 === "paper")
  ) {
    return "Player 1 wins!";
  }
  return "Player 2 wins!";
}

// Main
const roomName = getRoomName();
if (!roomName || roomName === "rps") {
  createRoomForm();
} else {
  showGameUI(roomName);
}
