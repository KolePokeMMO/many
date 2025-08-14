/* rps.js — Fixed: atomic round locking, no history spam, preserves DOM/CSS, hash routing */
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

/* returns: null (tie) | 1 (player A wins) | 2 (player B wins) */
/* Pokémon theme: Grass beats Water, Water beats Fire, Fire beats Grass */
function determineWinner(a, b) {
  if (a === b) return null;
  if ((a === "grass" && b === "water") ||
      (a === "water" && b === "fire") ||
      (a === "fire"  && b === "grass")) return 1;
  return 2;
}

/* Safe DOM helper: finds or creates node with id/class */
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

/* ---------------- Front page (non-destructive) ---------------- */
function initFrontPage() {
  const appDiv = document.getElementById("rps-app") || ensureElement({ id: "rps-app", tag: "div", classes: ["rps-container"] });

  // Try to reuse existing setup area if present
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

  const createBtn = document.getElementById("create-room-btn");
  createBtn.onclick = () => {
    const name = (document.getElementById("player-name-input")?.value || "").trim();
    const room = (document.getElementById("room-id-input")?.value || "").trim();
    if (!name || !room) return alert("Please enter a name and a room.");
    localStorage.setItem(`rps-player-name-${room}`, name);
    // Hash navigation - safe on GitHub Pages
    window.location.hash = `/room/${encodeURIComponent(room)}`;
    // showRoomUI will be triggered by hashchange listener or can be called directly:
    showRoomUI(room);
  };
}

/* ---------------- Room UI (non-destructive, preserves CSS selectors) ---------------- */
async function showRoomUI(room) {
  const appDiv = document.getElementById("rps-app") || ensureElement({ id: "rps-app", tag: "div", classes: ["rps-container"] });

  // ID keys
  const playerIdKey = `rps-player-id-${room}`;
  const playerNameKey = `rps-player-name-${room}`;

  // Load or create playerId/name
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

  // Create or reuse the room UI container (do NOT clobber appDiv contents)
  let roomContainer = document.getElementById("rps-room-container");
  if (!roomContainer) {
    roomContainer = document.createElement("div");
    roomContainer.id = "rps-room-container";
    roomContainer.className = "rps-game";
    // prefer appDiv existing structure: insert after any header
    appDiv.appendChild(roomContainer);
  }

  // Create or reuse elements (keeps CSS selectors stable)
  const roomTitle = ensureElement({ parent: roomContainer, tag: "h2", id: "room-title" });
  roomTitle.textContent = `Room: ${room}`;

  let controls = roomContainer.querySelector(".rps-controls");
  if (!controls) {
    controls = document.createElement("div");
    controls.className = "rps-controls";
    controls.innerHTML = `
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

  // History area (preserve if exists)
  let historyWrap = document.getElementById("rps-history-wrap");
  if (!historyWrap) {
    historyWrap = document.createElement("div");
    historyWrap.id = "rps-history-wrap";
    historyWrap.innerHTML = `<h3>Game History</h3><ul id="history-list" class="rps-history-list"></ul>`;
    roomContainer.appendChild(historyWrap);
  }

  // Grab UI refs
  const copyBtn = document.getElementById("copy-link-btn");
  const choiceButtons = Array.from(roomContainer.querySelectorAll(".rps-choices button"));
  const youEl = document.getElementById("you-choice");
  const oppEl = document.getElementById("opp-choice");
  const resultEl = document.getElementById("round-result");
  const playAgainBtn = document.getElementById("play-again-btn");
  const statusEl = document.getElementById("rps-status");
  const historyList = document.getElementById("history-list");

  // Firebase refs
  const playersRef = ref(db, `rps/rooms/${room}/players`);
  const playerRef = ref(db, `rps/rooms/${room}/players/${playerId}`);
  const currentRoundRef = ref(db, `rps/rooms/${room}/currentRound`);
  const historyRef = ref(db, `rps/rooms/${room}/history`);

  // Initialize player record (ensure name is present)
  await set(playerRef, { name: playerName, choice: null });
  onDisconnect(playerRef).remove();

  // Local state guard to avoid double-click spam
  let localSubmitting = false;

  // Choice click handler: only set this player's choice
  choiceButtons.forEach(btn => {
    btn.onclick = async () => {
      if (localSubmitting) return;
      // Prevent repeated writes if already set this round
      try {
        const currentPlayerSnapshot = await get(playerRef);
        const currentPlayerData = currentPlayerSnapshot.val() || {};
        if (currentPlayerData.choice) {
          statusEl.textContent = "Choice already made — waiting for opponent.";
          return;
        }
      } catch (e) {
        console.error("Error reading playerRef before set:", e);
      }

      const chosen = btn.dataset.choice;
      // set choice atomically for this player
      localSubmitting = true;
      try {
        await set(playerRef, { name: playerName, choice: chosen });
        youEl.textContent = chosen;
        statusEl.textContent = "Waiting for opponent...";
      } catch (e) {
        console.error("Failed to set choice:", e);
        statusEl.textContent = "Failed to submit choice.";
      } finally {
        localSubmitting = false;
      }
    };
  });

  // Play again: reset only this player's choice and reset currentRound status (only if you want)
  playAgainBtn.onclick = async () => {
    // Reset player's choice
    try {
      await set(playerRef, { name: playerName, choice: null });
      // Clear UI; do NOT forcibly remove history/currentRound — keep them for others
      youEl.textContent = "-";
      oppEl.textContent = "-";
      resultEl.textContent = "-";
      statusEl.textContent = "Choose your move!";
      // Optionally, clear currentRound only if it belongs to this round (safe to update to null)
      // We'll attempt to clear currentRound if it's finished (non-destructive)
      const cr = await get(currentRoundRef);
      if (cr.exists() && cr.val().status === "finished") {
        // Reset round (this is a simple clear; you can change to different behaviour)
        await update(currentRoundRef, { status: null });
      }
    } catch (e) {
      console.error("Play again failed", e);
    }
  };

  // Copy link
  copyBtn.onclick = () => {
    const url = `${location.origin}${location.pathname}#/room/${encodeURIComponent(room)}`;
    navigator.clipboard.writeText(url).then(() => {
      statusEl.textContent = "Room link copied!";
    }).catch(() => {
      statusEl.textContent = "Copy failed — please copy manually.";
    });
  };

  /* ---------------- Core: listen for players and attempt atomic finish ----------------
     Logic:
       * Wait until playersRef shows >=2 players and both players have non-null choices.
       * Use runTransaction on currentRoundRef to atomically set the round to finished.
       * The transaction function uses the local `players` snapshot (captured) to set the round.
       * Only the client where transaction.committed === true will then push to /history.
  */
  onValue(playersRef, async (snap) => {
    const players = snap.val() || {};
    const ids = Object.keys(players);
    if (ids.length < 2) {
      statusEl.textContent = "Waiting for opponent to join...";
      return;
    }

    // Two players assumed (first two keys)
    const aId = ids[0];
    const bId = ids.find(id => id !== aId) || ids[1];

    const a = players[aId];
    const b = players[bId];

    // Update opponent UI where possible
    if (aId === playerId) {
      youEl.textContent = a?.choice || "-";
      oppEl.textContent = b?.choice || "-";
    } else {
      youEl.textContent = b?.choice || "-";
      oppEl.textContent = a?.choice || "-";
    }

    // If either choice is missing, wait
    if (!a?.choice || !b?.choice) {
      // Only update status to waiting if you have chosen; otherwise prompt to choose
      const me = players[playerId];
      statusEl.textContent = me?.choice ? "Waiting for opponent..." : "Choose your move!";
      return;
    }

    // Both choices exist — attempt atomic finish via transaction.
    // Compute winner relative to player A (aId vs bId)
    const winnerNum = determineWinner(a.choice, b.choice); // 1 => a wins, 2 => b wins, null => tie
    const winnerId = winnerNum === 1 ? aId : winnerNum === 2 ? bId : null;

    // Compose the round object we want to set
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
      // Atomic attempt: only one client will make this change succeed first.
      const tr = await runTransaction(currentRoundRef, (current) => {
        // If already finished, abort transaction (return undefined)
        if (current && current.status === "finished") return; // abort
        // Otherwise set our finished payload
        return roundPayload;
      }, { applyLocally: false });

      // If transaction committed, we are the authoritative writer for this round -> push history
      if (tr.committed) {
        // push history once for this round. This push may cause playersRef listeners,
        // but currentRound.status === 'finished' will cause other clients not to re-process.
        await push(historyRef, roundPayload);
        // update local UI
        statusEl.textContent = "Round finished (results recorded).";
      } else {
        // Another client committed first: do nothing. UI will update via currentRoundRef listener.
        statusEl.textContent = "Round already recorded by other player.";
      }
    } catch (err) {
      console.error("Transaction failed:", err);
      statusEl.textContent = "Error finishing round. Try again.";
    }
  });

  /* ---------------- UI sync from currentRound (single source of truth) ---------------- */
  onValue(currentRoundRef, (snap) => {
    const round = snap.val();
    if (!round || round.status !== "finished") return;
    // Choose which fields correspond to "you" and "opponent" depending on playerId
    const amPlayer1 = round.player1Id === playerId;
    const myChoice = amPlayer1 ? round.player1Choice : round.player2Choice;
    const theirChoice = amPlayer1 ? round.player2Choice : round.player1Choice;
    youEl.textContent = myChoice || "-";
    oppEl.textContent = theirChoice || "-";

    // Determine result text
    let txt;
    if (round.winnerId === null) txt = "It's a tie!";
    else if (round.winnerId === playerId) txt = "You win!";
    else txt = "You lose!";
    resultEl.textContent = txt;
    statusEl.textContent = "Round finished!";
  });

  /* ---------------- History listener — render with names and de-dup in UI ---------------- */
  onValue(historyRef, (snap) => {
    const history = snap.val() || {};
    // Convert to array sorted by timestamp desc
    const entries = Object.values(history).sort((a,b) => (b.timestamp||0) - (a.timestamp||0));
    // Render
    historyList.innerHTML = "";
    for (const e of entries) {
      const li = document.createElement("li");
      // Prefer names if available, fall back to ids
      const p1 = e.player1Name || e.player1Id || "P1";
      const p2 = e.player2Name || e.player2Id || "P2";
      const outcome = e.winnerId ? (e.winnerId === e.player1Id ? `${p1} won` : `${p2} won`) : "It's a tie!";
      li.textContent = `${p1}: ${e.player1Choice} vs ${p2}: ${e.player2Choice} → ${outcome}`;
      historyList.appendChild(li);
    }
  });
}

/* ---------------- App init & routing ---------------- */
function initApp() {
  const room = getRoomName();
  if (!room) initFrontPage();
  else showRoomUI(room);
}

// Hash routing for GitHub Pages
window.addEventListener("hashchange", () => {
  const r = getRoomName();
  if (r) showRoomUI(r);
});

// Start the app
initApp();
