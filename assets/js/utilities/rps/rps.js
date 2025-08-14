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

// ───────────── FIREBASE CONFIG ─────────────
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

// ───────────── UTILITY FUNCTIONS ─────────────
function getRoomName() {
  const hash = window.location.hash;
  if (!hash.startsWith("#/room/")) return null;
  return decodeURIComponent(hash.split("/")[2] || "");
}

function determineWinner(p1, p2) {
  if (p1 === p2) return null;
  if ((p1 === "grass" && p2 === "water") ||
      (p1 === "water" && p2 === "fire") ||
      (p1 === "fire" && p2 === "grass")) return 1;
  return 2;
}

// ───────────── FRONT PAGE ─────────────
function initFrontPage() {
  const appDiv = document.getElementById("rps-app");
  appDiv.innerHTML = `
    <div class="setup">
      <input type="text" id="player-name-input" placeholder="Enter your name" />
      <input type="text" id="room-id-input" placeholder="Enter Room Name" />
      <button id="create-room-btn">Create / Join Room</button>
    </div>
  `;

  document.getElementById("create-room-btn").addEventListener("click", () => {
    const name = document.getElementById("player-name-input").value.trim();
    const room = document.getElementById("room-id-input").value.trim();
    if (!name || !room) return alert("Enter both name and room.");
    localStorage.setItem(`rps-player-name-${room}`, name);
    window.location.hash = `/room/${encodeURIComponent(room)}`;
    showRoomUI(room);
  });
}

// ───────────── MAIN GAME ─────────────
function showRoomUI(room) {
  const appDiv = document.getElementById("rps-app");
  const playerKey = `rps-player-id-${room}`;
  const nameKey = `rps-player-name-${room}`;

  let playerId = localStorage.getItem(playerKey);
  let playerName = localStorage.getItem(nameKey);

  if (!playerId) {
    playerId = crypto.randomUUID();
    localStorage.setItem(playerKey, playerId);
  }
  if (!playerName || playerName.trim() === "") {
    playerName = prompt("Enter your name:");
    localStorage.setItem(nameKey, playerName);
  }

  appDiv.innerHTML = `
    <div class="rps-game" style="display:flex; gap:20px;">
      <div style="flex:1;">
        <h2>Room: ${room}</h2>
        <button id="copy-link">Copy Room Link</button>
        <div class="rps-buttons" style="margin-top:10px;">
          <button data-choice="grass">🌿 Grass</button>
          <button data-choice="fire">🔥 Fire</button>
          <button data-choice="water">💧 Water</button>
        </div>
        <p>You chose: <span id="you">-</span></p>
        <p>Opponent chose: <span id="opp">-</span></p>
        <p>Result: <strong id="result">-</strong></p>
        <button id="restart-btn" style="margin-top:15px;">Play Again</button>
        <div id="rps-status" style="margin-top:10px;"></div>
      </div>
      <div style="width:250px;">
        <h3>Game History</h3>
        <ul id="history-list"></ul>
      </div>
    </div>
  `;

  const playerRef = ref(db, `rps/rooms/${room}/players/${playerId}`);
  set(playerRef, { choice: null, name: playerName });
  onDisconnect(playerRef).remove();

  const playersRef = ref(db, `rps/rooms/${room}/players`);
  const currentRoundRef = ref(db, `rps/rooms/${room}/currentRound`);
  const historyRef = ref(db, `rps/rooms/${room}/history`);

  let roundActive = true;

  // ───────────── BUTTON CHOICE ─────────────
  document.querySelectorAll(".rps-buttons button").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!roundActive) return;
      const choice = btn.dataset.choice;
      document.getElementById("you").textContent = choice;
      set(playerRef, { choice, name: playerName });
      document.getElementById("rps-status").textContent = "Waiting for opponent...";
    });
  });

  // ───────────── COPY LINK ─────────────
  document.getElementById("copy-link").addEventListener("click", () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert("Room link copied!"))
      .catch(() => alert("Failed to copy link."));
  });

  // ───────────── RESTART ROUND ─────────────
  document.getElementById("restart-btn").addEventListener("click", () => {
    update(currentRoundRef, { status: null });
    roundActive = true;
    document.getElementById("you").textContent = "-";
    document.getElementById("opp").textContent = "-";
    document.getElementById("result").textContent = "-";
    document.getElementById("rps-status").textContent = "Choose your move!";
    set(playerRef, { choice: null, name: playerName });
  });

  // ───────────── MAIN GAME LOGIC ─────────────
  onValue(playersRef, async snapshot => {
    const players = snapshot.val() || {};
    const keys = Object.keys(players);
    if (keys.length < 2) return document.getElementById("rps-status").textContent = "Waiting for second player...";

    const yourChoice = players[playerId]?.choice;
    const opponentKey = keys.find(k => k !== playerId);
    const opponentChoice = players[opponentKey]?.choice;

    if (!yourChoice || !opponentChoice) return;

    const roundSnap = await get(currentRoundRef);
    const round = roundSnap.val();
    if (round?.status === 'finished') return; // ✅ Already processed

    // Determine winner
    const winnerNum = determineWinner(yourChoice, opponentChoice);
    const winnerId = winnerNum === 1 ? playerId : winnerNum === 2 ? opponentKey : null;

    // Lock round first
    await update(currentRoundRef, {
      status: 'finished',
      player1Id: keys[0],
      player2Id: keys[1],
      player1Choice: players[keys[0]].choice,
      player2Choice: players[keys[1]].choice,
      winnerId
    });

    // ✅ Only now push to history once
    await push(historyRef, {
      player1Id: keys[0],
      player2Id: keys[1],
      player1Choice: players[keys[0]].choice,
      player2Choice: players[keys[1]].choice,
      winnerId,
      timestamp: Date.now()
    });
  });

  // ───────────── UPDATE UI FROM ROUND ─────────────
  onValue(currentRoundRef, snapshot => {
    const round = snapshot.val();
    if (!round || round.status !== "finished") return;
    roundActive = false;

    const yourChoice = round.player1Id === playerId ? round.player1Choice : round.player2Choice;
    const opponentChoice = round.player1Id === playerId ? round.player2Choice : round.player1Choice;

    document.getElementById("you").textContent = yourChoice;
    document.getElementById("opp").textContent = opponentChoice;

    const resultText = round.winnerId === null
      ? "It's a tie!"
      : round.winnerId === playerId
      ? "You win!"
      : "You lose!";
    document.getElementById("result").textContent = resultText;
    document.getElementById("rps-status").textContent = "Round finished!";
  });

  // ───────────── HISTORY LOG ─────────────
  onValue(historyRef, snapshot => {
    const history = snapshot.val() || {};
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = "";

    Object.entries(history)
      .sort((a,b) => b[1].timestamp - a[1].timestamp)
      .forEach(([key, entry]) => {
        let outcome = "It's a tie!";
        if (entry.winnerId) outcome = entry.winnerId === entry.player1Id ? `${entry.player1Id} won` : `${entry.player2Id} won`;
        const li = document.createElement("li");
        li.textContent = `${entry.player1Choice} vs ${entry.player2Choice} → ${outcome}`;
        historyList.appendChild(li);
      });
  });
}

// ───────────── SPA INIT ─────────────
function initApp() {
  const roomName = getRoomName();
  if (!roomName) initFrontPage();
  else showRoomUI(roomName);
}
window.addEventListener("hashchange", () => {
  const roomName = getRoomName();
  if (roomName) showRoomUI(roomName);
});
initApp();
