// rps.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  update,
  remove,
  get,
  onDisconnect,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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
      <input type="text" id="player-name-input" placeholder="Enter your name" />
      <input type="text" id="room-name-input" placeholder="Enter a room name" />
      <button id="join-room-btn">Create / Join Room</button>
    </div>
  `;

  document.getElementById("join-room-btn").addEventListener("click", () => {
    const name = document.getElementById("player-name-input").value.trim();
    const room = document.getElementById("room-name-input").value.trim();
    if (name && room) {
      localStorage.setItem(`rps-player-name-${room}`, name);
      window.location.href = `/many/utilities/rps/?room=${encodeURIComponent(room)}`;
    } else {
      alert("Please enter both your name and room name.");
    }
  });
}

function determineWinnerPlayerId(p1, p2, playerKeys) {
  if (p1 === p2) return null; // Draw when choices equal
  if (
    (p1 === "rock" && p2 === "scissors") ||
    (p1 === "paper" && p2 === "rock") ||
    (p1 === "scissors" && p2 === "paper")
  )
    return playerKeys[0];
  return playerKeys[1];
}

async function showGameUI(room) {
  const playerKey = `rps-player-id-${room}`;
  const nameKey = `rps-player-name-${room}`;
  let playerId = localStorage.getItem(playerKey);
  let playerName = localStorage.getItem(nameKey);

  if (!playerId) {
    playerId = crypto.randomUUID();
    localStorage.setItem(playerKey, playerId);
  }

  while (!playerName || playerName.trim() === "") {
    playerName = prompt("Enter your name to join the game:");
    if (!playerName || playerName.trim() === "") {
      alert("Please enter a valid name.");
    } else {
      playerName = playerName.trim();
      localStorage.setItem(nameKey, playerName);
    }
  }

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
        <ul id="history-list" style="list-style: none; padding-left: 0; max-height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; background: #1a1a1a; color: #ffd700;"></ul>
      </div>
    </div>
  `;

  const playerRef = ref(db, `rps/rooms/${room}/players/${playerId}`);
  set(playerRef, { choice: null, timestamp: Date.now(), name: playerName });
  onDisconnect(playerRef).remove();

  let roundActive = true;
  let lastClick = 0;
  let bothChosen = false;

  document.querySelectorAll(".rps-buttons button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const now = Date.now();
      if (!roundActive || now - lastClick < 500) return;
      lastClick = now;
      const choice = btn.dataset.choice;
      set(playerRef, { choice, timestamp: now, name: playerName });
      document.getElementById("you").textContent = choice;
      document.getElementById("result").textContent = "-";
      document.getElementById("opp").textContent = "-";
      bothChosen = false;
      document.getElementById("rps-status").textContent = "Waiting for opponent...";
    });
  });

  document.getElementById("restart-btn").addEventListener("click", () => {
    remove(ref(db, `rps/rooms/${room}/players`));
    update(ref(db, `rps/rooms/${room}`), { currentRound: null });
    roundActive = true;
    bothChosen = false;
    document.getElementById("you").textContent = "-";
    document.getElementById("opp").textContent = "-";
    document.getElementById("result").textContent = "-";
    document.getElementById("rps-status").textContent = "Game restarted. Choose your move!";
  });

  document.getElementById("copy-link").addEventListener("click", () => {
    const fullLink = window.location.href;
    navigator.clipboard
      .writeText(fullLink)
      .then(() => {
        alert("Room link copied!");
      })
      .catch(() => {
        alert("Failed to copy link. Please copy manually.");
      });
  });

  const playersRef = ref(db, `rps/rooms/${room}/players`);
  const currentRoundRef = ref(db, `rps/rooms/${room}/currentRound`);
  const historyRef = ref(db, `rps/rooms/${room}/history`);

  onValue(playersRef, (snapshot) => {
    const players = snapshot.val() || {};
    const keys = Object.keys(players);

    if (keys.length < 2) {
      roundActive = true;
      bothChosen = false;
      document.getElementById("rps-status").textContent = "Waiting for second player...";
      document.getElementById("you").textContent = players[playerId]?.choice || "-";
      document.getElementById("opp").textContent = "-";
      return;
    }

    const yourChoice = players[playerId]?.choice || null;
    const opponentKey = keys.find((k) => k !== playerId);
    const opponentChoice = players[opponentKey]?.choice || null;

    if (yourChoice && opponentChoice) {
      bothChosen = true;
      document.getElementById("you").textContent = yourChoice;
      document.getElementById("opp").textContent = opponentChoice;
    } else {
      bothChosen = false;
      document.getElementById("you").textContent = yourChoice || "-";
      document.getElementById("opp").textContent = "-";
    }

    if (!yourChoice) {
      document.getElementById("rps-status").textContent = "Waiting for you to choose...";
      return;
    }
    if (!opponentChoice) {
      document.getElementById("rps-status").textContent = "Waiting for opponent to choose...";
      return;
    }

    get(currentRoundRef).then((snap) => {
      if (snap.exists() && snap.val().status === "finished") return;

      const winnerId = determineWinnerPlayerId(
        players[keys[0]].choice,
        players[keys[1]].choice,
        keys
      );
      update(currentRoundRef, {
        status: "finished",
        winnerId,
        player1Choice: players[keys[0]].choice,
        player2Choice: players[keys[1]].choice,
        player1Name: players[keys[0]].name,
        player2Name: players[keys[1]].name,
      });
      push(historyRef, {
        player1Id: keys[0],
        player2Id: keys[1],
        player1Choice: players[keys[0]].choice,
        player2Choice: players[keys[1]].choice,
        player1Name: players[keys[0]].name,
        player2Name: players[keys[1]].name,
        winnerId,
        timestamp: Date.now(),
      });
    });
  });

  onValue(currentRoundRef, (snapshot) => {
    const round = snapshot.val();
    if (!round || round.status !== "finished") return;
    roundActive = false;

    const resultText =
      round.winnerId === null
        ? "It's a tie!"
        : round.winnerId === playerId
        ? "You win!"
        : "You lose!";

    document.getElementById("result").textContent = resultText;

    if (bothChosen) {
      document.getElementById("rps-status").textContent = `${round.player1Name}: ${round.player1Choice}, ${round.player2Name}: ${round.player2Choice}`;
    } else {
      document.getElementById("rps-status").textContent = "Waiting for both to choose...";
    }
  });

  onValue(historyRef, (snapshot) => {
    const history = snapshot.val();
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = "";
    if (!history) return;

    const entries = Object.entries(history).sort(
      (a, b) => b[1].timestamp - a[1].timestamp
    );

    for (const [key, entry] of entries) {
      const li = document.createElement("li");
      let outcome;
      if (entry.winnerId === null) outcome = "It's a tie!";
      else outcome = `${entry.winnerId === entry.player1Id ? entry.player1Name : entry.player2Name} won`;

      li.textContent = `${entry.player1Name}: ${entry.player1Choice}, ${entry.player2Name}: ${entry.player2Choice} → ${outcome}`;
      li.style.marginBottom = "6px";
      historyList.appendChild(li);
    }
  });
}

const roomName = getRoomName();
if (!roomName || roomName.toLowerCase() === "rps") {
  createRoomForm();
} else {
  showGameUI(roomName);
}
