import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

// 🔧 Firebase config
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

// 📦 Grab the DOM mount point
const container = document.getElementById("rps-app");

// 🧠 Get room ID from the URL
const urlParams = new URLSearchParams(window.location.search);
let gameId = urlParams.get("room");

// 🌱 If no room yet, ask for one
if (!gameId) {
  container.innerHTML = `
    <div class="room-setup">
      <h2>Create a Room</h2>
      <input id="room-input" placeholder="Enter room name..." />
      <button id="start-room">Start</button>
    </div>
  `;

  document.getElementById("start-room").onclick = () => {
    const input = document.getElementById("room-input").value.trim();
    if (!input) return alert("Please enter a room name.");
    const newUrl = `${location.pathname}?room=${encodeURIComponent(input)}`;
    window.location.href = newUrl;
  };
  return;
}

// 🎲 Assign or load player ID
let playerId = localStorage.getItem("rps-player-id");
if (!playerId) {
  playerId = Math.random().toString(36).slice(2);
  localStorage.setItem("rps-player-id", playerId);
}

// 🧱 Game UI
container.innerHTML = `
  <div class="rps-game">
    <h2>Rock, Paper, Scissors</h2>
    <div id="room-info">
      Room: <code>${gameId}</code>
      <button id="copy-link">Copy Room Link</button>
    </div>
    <div id="status">Waiting for move...</div>
    <div class="rps-buttons">
      <button onclick="choose('rock')">🪨 Rock</button>
      <button onclick="choose('paper')">📄 Paper</button>
      <button onclick="choose('scissors')">✂️ Scissors</button>
    </div>
    <p>You chose: <span id="you">-</span></p>
    <p>Opponent chose: <span id="opp">-</span></p>
    <p>Result: <strong id="result">-</strong></p>
  </div>
`;

// 🔗 Copy button logic
document.getElementById("copy-link").onclick = () => {
  const url = `${location.origin}${location.pathname}?room=${gameId}`;
  navigator.clipboard.writeText(url).then(() => {
    alert("Room link copied to clipboard!");
  });
};

// 🌊 Global choose handler
window.choose = (move) => {
  document.getElementById('you').textContent = move;
  set(ref(db, `games/${gameId}/${playerId}`), {
    move,
    time: Date.now()
  });
};

// 👀 Listen for moves
onValue(ref(db, `games/${gameId}`), (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  const players = Object.keys(data);
  if (players.length < 2) return;

  const [p1, p2] = players;
  const m1 = data[p1], m2 = data[p2];

  if (m1 && m2) {
    const yourMove = data[playerId]?.move;
    const opponentId = players.find(p => p !== playerId);
    const theirMove = data[opponentId]?.move;

    document.getElementById("opp").textContent = theirMove || "-";
    document.getElementById("result").textContent = getResult(m1.move, m2.move, playerId === p1);
  }
});

// 🧠 Game logic
function getResult(m1, m2, isPlayer1) {
  if (m1 === m2) return "Draw";
  const win = (m1 === "rock" && m2 === "scissors") ||
              (m1 === "scissors" && m2 === "paper") ||
              (m1 === "paper" && m2 === "rock");
  return (isPlayer1 === win) ? "You win!" : "You lose!";
}
