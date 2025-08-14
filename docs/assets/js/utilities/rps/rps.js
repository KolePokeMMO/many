/* rps.js — Fixed: hide opponent until both choose, robust Play Again reset, preserves CSS selectors */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  update,
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
  const createBtn = document.getElementById("create-room-btn");
  createBtn.onclick = () => {
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
  if (!playerId) { playerId = crypto.randomUUID(); localStorage.setItem(playerIdKey, playerId); }
  let playerName = localStorage.getItem(playerNameKey) || "";
  if (!playerName) {
    playerName = prompt("Enter your Trainer name:") || `Trainer-${playerId.slice(0,6)}`;
    localStorage.setItem(playerNameKey, playerName);
  }

  // create/reuse room container (use class expected by CSS)
  let roomContainer = document.getElementById("rps-room-container");
  if (!roomContainer) {
    roomContainer = document.createElement("div");
    roomContainer.id = "rps-room-container";
    roomContainer.className = "rps-game-ui"; // match your CSS
    appDiv.appendChild(roomContainer);
  }

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

  // history element -> use id game-history so CSS picks it up
  let historyWrap = document.getElementById("rps-history-wrap");
  if (!historyWrap) {
    historyWrap = document.createElement("div");
    historyWrap.id = "rps-history-wrap";
    historyWrap.innerHTML = `<h3>Game History</h3><ul id="game-history" class="rps-history-list"></ul>`;
    roomContainer.appendChild(historyWrap);
  }

  // refs
  const copyBtn = document.getElementById("copy-link-btn");
  const choiceButtons = Array.from(roomContainer.querySelectorAll(".rps-choices button"));
  const youEl = document.getElementById("you-choice");
  const oppEl = document.getElementById("opp-choice");
  const resultEl = document.getElementById("round-result");
  const playAgainBtn = document.getElementById("play-again-btn");
  const statusEl = document.getElementById("rps-status");
  const historyList = document.getElementById("game-history");

  // Firebase refs
  const playersRef = ref(db, `rps/rooms/${room}/players`);
  const playerRef = ref(db, `rps/rooms/${room}/players/${playerId}`);
  const currentRoundRef = ref(db, `rps/rooms/${room}/currentRound`);
  const historyRef = ref(db, `rps/rooms/${room}/history`);

  // init player entry
  await set(playerRef, { name: playerName, choice: null });
  onDisconnect(playerRef).remove();

  // local guard
  let localSubmitting = false;

  // choice handler: only set this player's choice, never reveal opponent
  choiceButtons.forEach(btn => {
    btn.onclick = async () => {
      if (localSubmitting) return;
      // quick check if we already have a choice this round
      const cur = await get(playerRef).catch(()=>null);
      if (cur && cur.val() && cur.val().choice) {
        statusEl.textContent = "Choice already made — waiting for opponent.";
        return;
      }

      const chosen = btn.dataset.choice;
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

  /* Play Again:
     - reset only this player's choice to null
     - then check playersRef: if both players choices are null, atomically reset currentRound.status to null
  */
  playAgainBtn.onclick = async () => {
    try {
      await set(playerRef, { name: playerName, choice: null });
      youEl.textContent = "-";
      oppEl.textContent = "-";
      resultEl.textContent = "-";
      statusEl.textContent = "Choose your move!";

      // check players: if both players have choice === null (or no choice), reset currentRound
      const playersSnap = await get(playersRef);
      const players = playersSnap.val() || {};
      const ids = Object.keys(players);
      if (ids.length >= 2) {
        const a = players[ids[0]];
        const b = players[ids[1]];
        const aHas = !!(a && a.choice);
        const bHas = !!(b && b.choice);
        if (!aHas && !bHas) {
          // both cleared — attempt safe transaction to clear currentRound only if finished
          await runTransaction(currentRoundRef, (cur) => {
            if (!cur) return { status: null };
            if (cur.status === "finished") return { status: null };
            return; // abort if not finished
          }).catch(()=>{/* ignore */});
        }
      }
    } catch (e) {
      console.error("Play again error:", e);
    }
  };

  // copy link
  copyBtn.onclick = () => {
    const url = `${location.origin}${location.pathname}#/room/${encodeURIComponent(room)}`;
    navigator.clipboard.writeText(url).then(()=> statusEl.textContent = "Room link copied!").catch(()=> statusEl.textContent = "Copy failed.");
  };

  /* ---------------- playersRef listener
     - Show YOUR current choice (if any)
     - DO NOT show opponent's choice unless both choices exist.
     - When both exist, attempt atomic finish via transaction (transaction will prevent duplicates).
  */
  onValue(playersRef, async (snap) => {
    const players = snap.val() || {};
    const ids = Object.keys(players);
    if (ids.length < 2) {
      statusEl.textContent = "Waiting for opponent to join...";
      return;
    }

    const aId = ids[0];
    const bId = ids.find(id => id !== aId) || ids[1];
    const a = players[aId] || {};
    const b = players[bId] || {};

    // Show only your own choice immediately; hide opponent until both chosen
    const me = players[playerId];
    youEl.textContent = me?.choice || "-";
    // hide opponent until both choices exist
    if (!a.choice || !b.choice) {
      oppEl.textContent = "-";
      statusEl.textContent = me?.choice ? "Waiting for opponent..." : "Choose your move!";
      return;
    }

    // both choices exist -> attempt atomic finish (payload uses names too)
    const roundPayload = {
      status: "finished",
      player1Id: aId,
      player2Id: bId,
      player1Choice: a.choice,
      player2Choice: b.choice,
      player1Name: a.name || "",
      player2Name: b.name || "",
      winnerId: (determineWinner(a.choice, b.choice) === 1 ? aId : determineWinner(a.choice, b.choice) === 2 ? bId : null),
      timestamp: Date.now()
    };

    try {
      const tr = await runTransaction(currentRoundRef, (cur) => {
        if (cur && cur.status === "finished") return; // abort
        return roundPayload;
      }, { applyLocally: false });

      if (tr.committed) {
        // only the committer pushes history
        await push(historyRef, roundPayload);
        statusEl.textContent = "Round finished (recorded).";
      } else {
        statusEl.textContent = "Round already recorded by other player.";
      }
    } catch (err) {
      console.error("Finish transaction error:", err);
      statusEl.textContent = "Error finishing round.";
    }
  });

  /* ---------------- currentRound single-source UI
     - When status finished, reveal both choices & result.
     - When status is not finished/cleared, show neutral UI (opponent hidden).
  */
  onValue(currentRoundRef, (snap) => {
    const round = snap.val();
    if (!round || round.status !== "finished") {
      // round cleared or not started
      resultEl.textContent = "-";
      // keep opponent hidden until both players choose
      if (!youEl.textContent || youEl.textContent === "-") statusEl.textContent = "Choose your move!";
      return;
    }

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

  /* ---------------- history render (uses names if available) ---------------- */
  onValue(historyRef, (snap) => {
    const history = snap.val() || {};
    const entries = Object.values(history).sort((a,b)=> (b.timestamp||0)-(a.timestamp||0));
    historyList.innerHTML = "";
    for (const e of entries) {
      const li = document.createElement("li");
      const p1 = e.player1Name || e.player1Id || "P1";
      const p2 = e.player2Name || e.player2Id || "P2";
      const outcome = e.winnerId ? (e.winnerId === e.player1Id ? `${p1} won` : `${p2} won`) : "It's a tie!";
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
