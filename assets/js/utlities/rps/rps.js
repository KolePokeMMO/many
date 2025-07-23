// rps.js
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

const gameId = "room1"; // Later: make this dynamic!
const playerId = Math.random().toString(36).slice(2);

  // Write a test message to confirm setup
  const testRef = ref(db, 'testMessage');
  set(testRef, { msg: "Firebase connected!" });

  // Optional: Read it back
  onValue(testRef, (snapshot) => {
    console.log("Message from Firebase:", snapshot.val());
  });

// 🧠 UI Rendering
document.getElementById('rps-app').innerHTML = `
  <div class="rps-game">
    <h2>Rock, Paper, Scissors</h2>
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

window.choose = (move) => {
  document.getElementById('you').textContent = move;
  set(ref(db, `games/${gameId}/${playerId}`), move);
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
    const yourMove = data[playerId];
    const opponentMove = players.find(p => p !== playerId);
    document.getElementById("opp").textContent = data[opponentMove];
    document.getElementById("result").textContent = getResult(m1, m2, playerId === p1);
  }
});

function getResult(m1, m2, isPlayer1) {
  if (m1 === m2) return "Draw";
  const win = (m1 === "rock" && m2 === "scissors") ||
              (m1 === "scissors" && m2 === "paper") ||
              (m1 === "paper" && m2 === "rock");
  return (isPlayer1 === win) ? "You win!" : "You lose!";
}
