// rps.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  remove,
  push,
  update
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

function getRoomName() {
  const params = new URLSearchParams(window.location.search);
  return params.get("room");
}

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
    <div class="rps-game-container" style="display: flex; gap: 20px;">
      <div class="rps-game" style="flex: 1;">
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
        <div id="rps-status" style="margin-top: 10px;"></div>
        <button id="restart-btn" style="margin-top: 15px;">Restart Round</button>
      </div>

      <div class="rps-history" style="flex: 0.5; background: #222; padding: 10px; border-radius: 8px; color: #eee; max-height: 400px; overflow-y: auto;">
        <h3>Game History</h3>
        <ul id="history-list" style="list-style: none; padding-left: 0; max-height: 360px; overflow-y: auto;"></ul>
      </div>
    </div>
  `;

  // Copy room link
  document.getElementById("copy-link").addEventListener("click", () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert("Room link copied to clipboard!");
    });
  });

  const playerId = localStorage.getItem("rps-player-id") || crypto.randomUUID();
  localStorage.setItem("rps-player-id", playerId);

  // Track if round is active
  let roundActive = true;

  // Choice buttons
  document.querySelectorAll(".rps-buttons button").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!roundActive) return; // prevent choosing if round ended
      const choice = btn.dataset.choice;
      set(ref(db, `rps/rooms/${room}/currentRound/players/${playerId}`), {
        choice: choice,
        timestamp: Date.now()
      });
      document.getElementById('you').textContent = choice;
      document.getElementById('result').textContent = "-";
      document.getElementById('opp').textContent = "-";
      document.getElementById('rps-status').textContent = "Waiting for opponent...";
    });
  });

  // Restart button logic: clear current round choices
  document.getElementById("restart-btn").addEventListener("click", () => {
    remove(ref(db, `rps/rooms/${room}/currentRound/players`));
    update(ref(db, `rps/rooms/${room}/currentRound`), { status: "waiting" });
    roundActive = true;
    // Reset UI locally
    document.getElementById("you").textContent = "-";
    document.getElementById("opp").textContent = "-";
    document.getElementById("result").textContent = "-";
    document.getElementById("rps-status").textContent = "Round restarted. Make your move!";
  });

  // Listen for current round changes
  const currentRoundRef = ref(db, `rps/rooms/${room}/currentRound`);
  onValue(currentRoundRef, snapshot => {
    const currentRound = snapshot.val();

    if (!currentRound || !currentRound.players) {
      // No moves yet
      document.getElementById("rps-status").textContent = "Waiting for both players to choose...";
      return;
    }

    const players = currentRound.players;
    const playerKeys = Object.keys(players);
    if (playerKeys.length < 2) {
      document.getElementById("rps-status").textContent = "Waiting for second player...";
      return;
    }

    // Choices
    const yourChoice = players[playerId]?.choice || "-";
    const opponentKey = playerKeys.find(k => k !== playerId);
    const opponentChoice = players[opponentKey]?.choice || "-";

    document.getElementById("you").textContent = yourChoice;
    document.getElementById("opp").textContent = opponentChoice;

    if (yourChoice === "-" || opponentChoice === "-") {
      document.getElementById("result").textContent = "-";
      document.getElementById("rps-status").textContent = yourChoice === "-" 
        ? "Waiting for you to choose..." 
        : "Waiting for opponent to choose...";
      return;
    }

    // Both chose, decide winner if round status is not finished
    if (currentRound.status !== "finished") {
      // Compute result
      const isPlayer1 = playerId === playerKeys[0];
      const resultText = getWinner(yourChoice, opponentChoice, isPlayer1);

      // Update status and result in DB
      update(ref(db, `rps/rooms/${room}/currentRound`), {
        status: "finished",
        result: resultText
      });

      // Append this round result to history
      const historyEntry = {
        player1Choice: players[playerKeys[0]].choice,
        player2Choice: players[playerKeys[1]].choice,
        result: resultText,
        timestamp: Date.now()
      };
      push(ref(db, `rps/rooms/${room}/history`), historyEntry);

      roundActive = false;
    } else {
      // Round finished, display result from DB
      document.getElementById("result").textContent = currentRound.result || "-";
      document.getElementById("rps-status").textContent = `Player 1 chose ${players[playerKeys[0]].choice}, Player 2 chose ${players[playerKeys[1]].choice}`;
    }
  });

  // Listen for game history updates
  const historyRef = ref(db, `rps/rooms/${room}/history`);
  onValue(historyRef, snapshot => {
    const history = snapshot.val();
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = "";
    if (!history) return;

    // Sort history by timestamp descending (latest first)
    const entries = Object.entries(history)
      .sort((a,b) => b[1].timestamp - a[1].timestamp);

    for (const [key, entry] of entries) {
      const li = document.createElement("li");
      li.textContent = `P1: ${entry.player1Choice}, P2: ${entry.player2Choice} → ${entry.result}`;
      li.style.marginBottom = "6px";
      historyList.appendChild(li);
    }
  });
}

function getWinner(p1, p2, isPlayer1) {
  if (p1 === p2) return "Draw!";
  const p1Wins = (p1 === "rock" && p2 === "scissors") ||
                 (p1 === "paper" && p2 === "rock") ||
                 (p1 === "scissors" && p2 === "paper");
  if (p1Wins) return isPlayer1 ? "You win!" : "You lose!";
  else return isPlayer1 ? "You lose!" : "You win!";
}

const roomName = getRoomName();
if (!roomName || roomName.toLowerCase() === "rps") {
  createRoomForm();
} else {
  showGameUI(roomName);
}
