// rps.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  update,
  remove
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
    <div class="rps-game" style="display:flex; gap:20px;">
      <div style="flex:1;">
        <h2>Room: ${room}</h2>
        <button id="copy-link">Copy Room Link</button>
        <div class="rps-buttons" style="margin-top: 10px;">
          <button data-choice="rock">🪨 Rock</button>
          <button data-choice="paper">📄 Paper</button>
          <button data-choice="scissors">✂️ Scissors</button>
        </div>
        <p>You chose: <span id="you">-</span></p>
        <p>Opponent chose: <span id="opp">-</span></p>
        <p>Result: <strong id="result">-</strong></p>
        <div id="rps-status"></div>
        <button id="restart-btn" style="margin-top: 15px;">Restart Game</button>
      </div>
      <div style="width: 250px;">
        <h3>Game History</h3>
        <ul id="history-list" style="list-style: none; padding-left: 0; max-height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;"></ul>
      </div>
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

  // Track if round is active
  let roundActive = true;

  // Player choice buttons
  document.querySelectorAll(".rps-buttons button").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!roundActive) return; // prevent choosing after round ended
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

  // Restart button clears choices for both players
  document.getElementById("restart-btn").addEventListener("click", () => {
    remove(ref(db, `rps/rooms/${room}/players`));
    update(ref(db, `rps/rooms/${room}`), { currentRound: null });
    roundActive = true;
    document.getElementById('you').textContent = "-";
    document.getElementById('opp').textContent = "-";
    document.getElementById('result').textContent = "-";
    document.getElementById('rps-status').textContent = "Game restarted. Choose your move!";
  });

  // Listen for players moves and game state
  const playersRef = ref(db, `rps/rooms/${room}/players`);
  const currentRoundRef = ref(db, `rps/rooms/${room}/currentRound`);
  const historyRef = ref(db, `rps/rooms/${room}/history`);

  // Listen to players' choices and game state
  onValue(playersRef, snapshot => {
    const players = snapshot.val() || {};
    const playerKeys = Object.keys(players);

    if (playerKeys.length < 2) {
      roundActive = true;
      document.getElementById("rps-status").textContent = "Waiting for second player...";
      document.getElementById("opp").textContent = "-";
      document.getElementById("result").textContent = "-";
      return;
    }

    const opponentKey = playerKeys.find(k => k !== playerId);
    if (!opponentKey) {
      document.getElementById("rps-status").textContent = "Waiting for opponent to join...";
      document.getElementById("opp").textContent = "-";
      document.getElementById("result").textContent = "-";
      return;
    }

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
      // Both players have chosen, but wait for currentRound status to update result
      // We'll handle displaying result in currentRound listener below
    }
  });

  // Listen for current round result and update UI accordingly
  onValue(currentRoundRef, snapshot => {
    const currentRound = snapshot.val();

    if (!currentRound || currentRound.status !== "finished") {
      // Round not finished yet
      return;
    }

    roundActive = false;

    const winnerId = currentRound.winnerId;
    let resultText;
    if (winnerId === null) resultText = "Draw!";
    else if (winnerId === playerId) resultText = "You win!";
    else resultText = "You lose!";

    document.getElementById("result").textContent = resultText;
    document.getElementById("rps-status").textContent = 
      `Player 1 chose ${currentRound.player1Choice}, Player 2 chose ${currentRound.player2Choice}`;
  });

  // Listen for both players to choose and update currentRound & history accordingly
  onValue(playersRef, snapshot => {
    const players = snapshot.val() || {};
    const playerKeys = Object.keys(players);

    if (playerKeys.length < 2) return;

    const currentRoundSnapshot = get(currentRoundRef).then(currentRound => {
      if (currentRound.exists() && currentRound.val().status === "finished") return; // already finished

      const p1Choice = players[playerKeys[0]]?.choice;
      const p2Choice = players[playerKeys[1]]?.choice;

      if (!p1Choice || !p2Choice) return; // wait for both choices

      // Determine winner playerId or null for draw
      const winnerId = determineWinnerPlayerId(p1Choice, p2Choice, playerKeys);

      // Update currentRound
      update(currentRoundRef, {
        status: "finished",
        winnerId,
        player1Choice: p1Choice,
        player2Choice: p2Choice
      });

      // Push round to history
      push(ref(db, `rps/rooms/${room}/history`), {
        player1Id: playerKeys[0],
        player2Id: playerKeys[1],
        player1Choice: p1Choice,
        player2Choice: p2Choice,
        winnerId,
        timestamp: Date.now()
      });
    });
  });

  // Listen and display game history, personalized
  onValue(ref(db, `rps/rooms/${room}/history`), snapshot => {
    const history = snapshot.val();
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = "";
    if (!history) return;

    const entries = Object.entries(history)
      .sort((a, b) => b[1].timestamp - a[1].timestamp);

    for (const [key, entry] of entries) {
      const li = document.createElement("li");

      let outcome;
      if (entry.winnerId === null) outcome = "Draw";
      else if (entry.winnerId === playerId) outcome = "You win";
      else outcome = "You lose";

      li.textContent = `P1: ${entry.player1Choice}, P2: ${entry.player2Choice} → ${outcome}`;
      li.style.marginBottom = "6px";
      historyList.appendChild(li);
    }
  });

}

// Determine winner by returning the winning player's ID, or null for draw
function determineWinnerPlayerId(p1, p2, playerKeys) {
  if (p1 === p2) return null;
  if (
    (p1 === "rock" && p2 === "scissors") ||
    (p1 === "paper" && p2 === "rock") ||
    (p1 === "scissors" && p2 === "paper")
  ) return playerKeys[0];
  return playerKeys[1];
}

// Main entry point
const roomName = getRoomName();
if (!roomName || roomName.toLowerCase() === "rps") {
  createRoomForm();
} else {
  showGameUI(roomName);
}
