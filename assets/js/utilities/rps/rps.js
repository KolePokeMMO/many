/* rps.js — Fixed: Play Again, separate Live Log vs History, atomic round finish */
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
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ---------------- FIREBASE ---------------- */
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

/* ---------------- Utilities ---------------- */
function getRoomName() {
  const hash = window.location.hash || "";
  if (!hash.startsWith("#/room/")) return null;
  return decodeURIComponent(hash.split("/")[2] || "");
}

function determineWinner(a, b) {
  if (a === b) return null;
  if ((a === "grass" && b === "water") ||
      (a === "water" && b === "fire") ||
      (a === "fire"  && b === "grass")) return 1;
  return 2;
}

function ensureElement({ parent = document, tag = "div", id = null, classes = [], insertAfter = null }) {
  let el = id ? document.getElementById(id) : null;
  if (!el) {
    el = document.createElement(tag);
    if (id) el.id = id;
    classes.forEach(c => el.classList.add(c));
    if (insertAfter && insertAfter.parentNode) insertAfter.parentNode.insertBefore(el, insertAfter.nextSibling);
    else parent.appendChild(el);
  }
  return el;
}

/* ---------------- Front page ---------------- */
function initFrontPage() {
  const appDiv = document.getElementById("rps-app") || ensureElement({ id: "rps-app", tag: "div", classes: ["rps-container"] });

  let setup = appDiv.querySelector(".rps-room-setup");
  if (!setup) {
    setup = document.createElement("div");
    setup.className = "rps-room-setup";
    setup.innerHTML = `
      <input type="text" id="player-name-input" placeholder="Your Trainer Name" />
      <input type="text" id="room-id-input" placeholder="Room Name" />
      <button id="create-room-btn">Create / Join Room</button>
    `;
    appDiv.prepend(setup);
  }

  document.getElementById("create-room-btn").onclick = () => {
    const name = (document.getElementById("player-name-input")?.value || "").trim();
    const room = (document.getElementById("room-id-input")?.value || "").trim();
    if (!name || !room) return alert("Please enter a name and a room.");
    localStorage.setItem(`rps-player-name-${room}`, name);
    window.location.hash = `/room/${encodeURIComponent(room)}`;
    showRoomUI(room);
  };
}

/* ---------------- Room UI ---------------- */
async function showRoomUI(room) {
  const appDiv = document.getElementById("rps-app") || ensureElement({ id: "rps-app", tag: "div", classes: ["rps-container"] });

  const playerIdKey = `rps-player-id-${room}`;
  const playerNameKey = `rps-player-name-${room}`;

  let playerId = localStorage.getItem(playerIdKey);
  if (!playerId) {
    playerId = crypto.randomUUID();
    localStorage.setItem(playerIdKey, playerId);
  }
  let playerName = localStorage.getItem(playerNameKey) || "";
  if (!playerName) {
    playerName = prompt("Enter your Trainer name:") || `Trainer-${playerId.slice(0,6)}`;
    localStorage.setItem(playerNameKey, playerName);
  }

  let roomContainer = document.getElementById("rps-room-container");
  if (!roomContainer) {
    roomContainer = document.createElement("div");
    roomContainer.id = "rps-room-container";
    roomContainer.className = "rps-game";
    appDiv.appendChild(roomContainer);
  }

  const roomTitle = ensureElement({ parent: roomContainer, tag: "h2", id: "room-title" });
  roomTitle.textContent = `Room: ${room}`;

  let controls = roomContainer.querySelector(".rps-controls");
  if (!controls) {
    controls = document.createElement("div");
    controls.className = "rps-controls";
    controls.innerHTML = `
      <div id="players-list">Players:</div>
      <button id="copy-link-btn">Copy Room Link</button>
      <div class="rps-choices">
        <button data-choice="grass">🌿 Grass</button>
        <button data-choice="fire">🔥 Fire</button>
        <button data-choice="water">💧 Water</button>
      </div>
      <div class="rps-results">
        <p>You chose: <span id="you-choice">-</span></p>
        <p>Opponent chose: <span id="opp-choice">-</span></p>
        <p>Round Result: <strong id="round-result">-</strong></p>
        <button id="play-again-btn">Play Again</button>
        <div id="rps-status" aria-live="polite" style="margin-top:8px;"></div>
      </div>
    `;
    roomContainer.appendChild(controls);
  }

  let historyWrap = document.getElementById("rps-history-wrap");
  if (!historyWrap) {
    historyWrap = document.createElement("div");
    historyWrap.id = "rps-history-wrap";
    historyWrap.innerHTML = `<h3>Game History</h3><ul id="history-list" class="rps-history-list"></ul>`;
    roomContainer.appendChild(historyWrap);
  }

  const copyBtn = document.getElementById("copy-link-btn");
  const choiceButtons = Array.from(roomContainer.querySelectorAll(".rps-choices button"));
  const youEl = document.getElementById("you-choice");
  const oppEl = document.getElementById("opp-choice");
  const resultEl = document.getElementById("round-result");
  const playAgainBtn = document.getElementById("play-again-btn");
  const statusEl = document.getElementById("rps-status");
  const historyList = document.getElementById("history-list");
  const playersList = document.getElementById("players-list");

  const playersRef = ref(db, `rps/rooms/${room}/players`);
  const playerRef = ref(db, `rps/rooms/${room}/players/${playerId}`);
  const currentRoundRef = ref(db, `rps/rooms/${room}/currentRound`);
  const historyRef = ref(db, `rps/rooms/${room}/history`);

  await set(playerRef, { name: playerName, choice: null });
  onDisconnect(playerRef).remove();

  let localSubmitting = false;

  choiceButtons.forEach(btn => {
    btn.onclick = async () => {
      if (localSubmitting) return;
      try {
        const currentPlayerSnapshot = await get(playerRef);
        const currentPlayerData = currentPlayerSnapshot.val() || {};
        if (currentPlayerData.choice) {
          statusEl.textContent = "Choice already made — waiting for opponent.";
          return;
        }
      } catch (e) {
        console.error(e);
      }

      const chosen = btn.dataset.choice;
      localSubmitting = true;
      try {
        await set(playerRef, { name: playerName, choice: chosen });
        youEl.textContent = chosen;
        statusEl.textContent = "Waiting for opponent...";
      } catch (e) {
        console.error(e);
        statusEl.textContent = "Failed to submit choice.";
      } finally {
        localSubmitting = false;
      }
    };
  });

  /* ---------------- Play Again ---------------- */
  playAgainBtn.onclick = async () => {
    try {
      // Reset only your choice
      await set(playerRef, { name: playerName, choice: null });
      youEl.textContent = "-";
      oppEl.textContent = "-";
      resultEl.textContent = "-";
      statusEl.textContent = "Choose your move!";

      // Clear current round if finished
      const crSnap = await get(currentRoundRef);
      const cr = crSnap.val();
      if (cr && cr.status === "finished") {
        await set(currentRoundRef, { status: null });
      }
    } catch (e) {
      console.error("Play again failed", e);
    }
  };

  copyBtn.onclick = () => {
    const url = `${location.origin}${location.pathname}#/room/${encodeURIComponent(room)}`;
    navigator.clipboard.writeText(url).then(() => {
      statusEl.textContent = "Room link copied!";
    }).catch(() => {
      statusEl.textContent = "Copy failed — please copy manually.";
    });
  };

  /* ---------------- Track players join/leave ---------------- */
  onValue(playersRef, (snap) => {
    const players = snap.val() || {};
    playersList.innerHTML = "Players:<br>" + Object.values(players).map(p => p.name).join("<br>");
  });

  /* ---------------- Core: atomic finish ---------------- */
  onValue(playersRef, async (snap) => {
    const players = snap.val() || {};
    const ids = Object.keys(players);
    if (ids.length < 2) {
      statusEl.textContent = "Waiting for opponent to join...";
      return;
    }

    const aId = ids[0];
    const bId = ids.find(id => id !== aId) || ids[1];
    const a = players[aId];
    const b = players[bId];

    if (aId === playerId) {
      youEl.textContent = a?.choice || "-";
      oppEl.textContent = b?.choice || "-";
    } else {
      youEl.textContent = b?.choice || "-";
      oppEl.textContent = a?.choice || "-";
    }

    if (!a?.choice || !b?.choice) {
      const me = players[playerId];
      statusEl.textContent = me?.choice ? "Waiting for opponent..." : "Choose your move!";
      return;
    }

    const winnerNum = determineWinner(a.choice, b.choice);
    const winnerId = winnerNum === 1 ? aId : winnerNum === 2 ? bId : null;

    const roundPayload = {
      status: "finished",
      player1Id: aId,
      player2Id: bId,
      player1Choice: a.choice,
      player2Choice: b.choice,
      player1Name: a.name || "",
      player2Name: b.name || "",
      winnerId: winnerId || null,
      timestamp: Date.now()
    };

    try {
      const tr = await runTransaction(currentRoundRef, (current) => {
        if (current && current.status === "finished") return;
        return roundPayload;
      }, { applyLocally: false });

      if (tr.committed) {
        await push(historyRef, roundPayload);
        statusEl.textContent = "Round finished (results recorded).";
      } else {
        statusEl.textContent = "Round already recorded by other player.";
      }
    } catch (err) {
      console.error("Transaction failed:", err);
      statusEl.textContent = "Error finishing round. Try again.";
    }
  });

  /* ---------------- Current round listener ---------------- */
  onValue(currentRoundRef, (snap) => {
    const round = snap.val();
    if (!round || round.status !== "finished") return;

    const amPlayer1 = round.player1Id === playerId;
    const myChoice = amPlayer1 ? round.player1Choice : round.player2Choice;
    const theirChoice = amPlayer1 ? round.player2Choice : round.player1Choice;
    youEl.textContent = myChoice || "-";
    oppEl.textContent = theirChoice || "-";

    let txt;
    if (round.winnerId === null) txt = "It's a tie!";
    else if (round.winnerId === playerId) txt = "You win!";
    else txt = "You lose!";
    resultEl.textContent = txt;
    statusEl.textContent = "Round finished!";
  });

  /* ---------------- Room history listener (this room only) ---------------- */
  onValue(historyRef, (snap) => {
    const history = snap.val() || {};
    const entries = Object.values(history).sort((a,b) => (b.timestamp||0) - (a.timestamp||0));
    historyList.innerHTML = "";
    for (const e of entries) {
      const p1 = e.player1Name || e.player1Id || "P1";
      const p2 = e.player2Name || e.player2Id || "P2";
      const outcome = e.winnerId ? (e.winnerId === e.player1Id ? `${p1} won` : `${p2} won`) : "It's a tie!";
      const li = document.createElement("li");
      li.textContent = `${p1}: ${e.player1Choice} vs ${p2}: ${e.player2Choice} → ${outcome}`;
      historyList.appendChild(li);
    }
  });
}

/* ---------------- App init ---------------- */
function initApp() {
  const room = getRoomName();
  if (!room) initFrontPage();
  else showRoomUI(room);
}

window.addEventListener("hashchange", () => {
  const r = getRoomName();
  if (r) showRoomUI(r);
});

initApp();
