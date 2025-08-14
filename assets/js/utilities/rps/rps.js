/* rps.js — Fixed: Play Again, room players, global vs room history, listener cleanup */
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
  runTransaction,
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

/* keep and clear onValue unsubscribes so we don't double-listen */
let activeUnsubscribes = [];
function clearUnsubscribes() {
  while (activeUnsubscribes.length) {
    try { activeUnsubscribes.pop()(); } catch(e){/*ignore*/ }
  }
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

  // also show a global live match log area on the front page
  let liveWrap = document.getElementById("live-match-log-wrap");
  if (!liveWrap) {
    liveWrap = document.createElement("div");
    liveWrap.id = "live-match-log-wrap";
    liveWrap.innerHTML = `<h3>Live Match Log</h3><ul id="live-match-log" class="rps-history-list"></ul>`;
    appDiv.appendChild(liveWrap);
  }

  // Start listening to global history for front page
  const globalRef = ref(db, "rps/globalHistory");
  // clean up previous listeners if any (e.g. navigation back/forth)
  clearUnsubscribes();
  const unsubGlobal = onValue(globalRef, snap => {
    const val = snap.val() || {};
    const arr = Object.values(val).sort((a,b) => (b.timestamp||0) - (a.timestamp||0));
    const liveEl = document.getElementById("live-match-log");
    if (liveEl) {
      liveEl.innerHTML = "";
      for (const e of arr) {
        const li = document.createElement("li");
        const p1 = e.player1Name || e.player1Id || "P1";
        const p2 = e.player2Name || e.player2Id || "P2";
        const outcome = e.winnerId ? (e.winnerId === e.player1Id ? `${p1} won` : `${p2} won`) : "It's a tie!";
        li.textContent = `${p1}: ${e.player1Choice} vs ${p2}: ${e.player2Choice} → ${outcome}`;
        liveEl.appendChild(li);
      }
    }
  });
  activeUnsubscribes.push(unsubGlobal);
}

/* ---------------- Room UI ---------------- */
async function showRoomUI(room) {
  // clear previous listeners when switching/initialising a room UI
  clearUnsubscribes();

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

  // create/reuse room container
  let roomContainer = document.getElementById("rps-room-container");
  if (!roomContainer) {
    roomContainer = document.createElement("div");
    roomContainer.id = "rps-room-container";
    roomContainer.className = "rps-game-ui";
    appDiv.appendChild(roomContainer);
  }

  // room title and players list
  const roomTitle = ensureElement({ parent: roomContainer, tag: "h2", id: "room-title" });
  roomTitle.textContent = `Room: ${room}`;

  let playersWrap = document.getElementById("room-players-wrap");
  if (!playersWrap) {
    playersWrap = document.createElement("div");
    playersWrap.id = "room-players-wrap";
    playersWrap.innerHTML = `<h4>Players</h4><ul id="room-players" class="rps-history-list"></ul>`;
    roomContainer.appendChild(playersWrap);
  }

  // controls (choices/results)
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
        <button id="play-again-btn" class="rps-btn">Play Again</button>
        <div id="rps-status" aria-live="polite" style="margin-top:8px;"></div>
      </div>
    `;
    roomContainer.appendChild(controls);
  }

  // room-only history (per-room)
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
  const roomPlayersEl = document.getElementById("room-players");
  const roomHistoryEl = document.getElementById("game-history");

  // firebase refs
  const playersRef = ref(db, `rps/rooms/${room}/players`);
  const playerRef = ref(db, `rps/rooms/${room}/players/${playerId}`);
  const currentRoundRef = ref(db, `rps/rooms/${room}/currentRound`);
  const roomHistoryRef = ref(db, `rps/rooms/${room}/history`);
  const globalHistoryRef = ref(db, `rps/globalHistory`);

  // initialize player entry
  await set(playerRef, { name: playerName, choice: null });
  onDisconnect(playerRef).remove();

  // enable UI
  choiceButtons.forEach(b => { b.disabled = false; b.style.pointerEvents = ""; });
  playAgainBtn.disabled = false;

  // local guard
  let localSubmitting = false;

  // choice handler
  choiceButtons.forEach(btn => {
    btn.onclick = async () => {
      if (localSubmitting) return;
      // if a round is currently finished, disallow choosing until cleared
      const crSnap = await get(currentRoundRef).catch(()=>null);
      if (crSnap && crSnap.exists() && crSnap.val().status === "finished") {
        statusEl.textContent = "Round finished; click Play Again to start a new round.";
        return;
      }
      // check if we already chose
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

  // Play Again: clear your choice and attempt to clear currentRound if finished
  playAgainBtn.onclick = async () => {
    try {
      await set(playerRef, { name: playerName, choice: null });
      youEl.textContent = "-";
      oppEl.textContent = "-";
      resultEl.textContent = "-";
      statusEl.textContent = "Choose your move!";

      // attempt to clear currentRound.status if it's finished
      await runTransaction(currentRoundRef, (cur) => {
        if (!cur) return;
        if (cur.status === "finished") {
          return { ...cur, status: null };
        }
        return; // abort if not finished
      }).catch(()=>{/*ignore*/});

      // re-enable choices locally immediately (makes Play Again responsive)
      choiceButtons.forEach(b => { b.disabled = false; b.style.pointerEvents = ""; });
    } catch (e) {
      console.error("Play again error:", e);
      statusEl.textContent = "Play Again failed.";
    }
  };

  // copy link
  copyBtn.onclick = () => {
    const url = `${location.origin}${location.pathname}#/room/${encodeURIComponent(room)}`;
    navigator.clipboard.writeText(url).then(()=> statusEl.textContent = "Room link copied!").catch(()=> statusEl.textContent = "Copy failed.");
  };

  /* ---------------- playersRef listener: update player list and your choice only ---------------- */
  const unsubPlayers = onValue(playersRef, async (snap) => {
    const players = snap.val() || {};
    const ids = Object.keys(players);
    // render players list (join/leave visibility)
    roomPlayersEl.innerHTML = "";
    for (const id of ids) {
      const li = document.createElement("li");
      li.textContent = players[id].name ? `${players[id].name}` : id;
      if (id === playerId) li.textContent += " (you)";
      roomPlayersEl.appendChild(li);
    }

    if (ids.length < 2) {
      statusEl.textContent = "Waiting for opponent to join...";
      return;
    }

    // show only your own current choice; hide opponent until currentRound finished
    const me = players[playerId];
    youEl.textContent = me?.choice || "-";

    // if both have chosen, attempt to finish atomically
    const aId = ids[0];
    const bId = ids.find(i => i !== aId) || ids[1];
    const a = players[aId] || {};
    const b = players[bId] || {};
    if (!a.choice || !b.choice) {
      oppEl.textContent = "-";
      statusEl.textContent = me?.choice ? "Waiting for opponent..." : "Choose your move!";
      return;
    }

    // both choices exist; disable choices until transaction completes
    choiceButtons.forEach(bn => { bn.disabled = true; bn.style.pointerEvents = "none"; });

    const winnerNum = determineWinner(a.choice, b.choice);
    const winnerId = winnerNum === 1 ? aId : winnerNum === 2 ? bId : null;
    const payload = {
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
      const tr = await runTransaction(currentRoundRef, (cur) => {
        if (cur && cur.status === "finished") return; // abort
        return payload;
      }, { applyLocally: false });

      if (tr.committed) {
        // push both room history and global history (only once)
        await push(roomHistoryRef, payload);
        await push(globalHistoryRef, payload);
        statusEl.textContent = "Round finished and recorded.";
      } else {
        statusEl.textContent = "Round already recorded by other player.";
      }
    } catch (err) {
      console.error("Finish transaction error:", err);
      statusEl.textContent = "Error finishing round.";
      choiceButtons.forEach(bn => { bn.disabled = false; bn.style.pointerEvents = ""; });
    }
  });
  activeUnsubscribes.push(unsubPlayers);

  /* ---------------- currentRound listener: authoritative reveal + UI state ---------------- */
  const unsubRound = onValue(currentRoundRef, (snap) => {
    const round = snap.val();
    if (!round || round.status !== "finished") {
      // allow choosing again (unless you already have a choice)
      choiceButtons.forEach(b => { b.disabled = false; b.style.pointerEvents = ""; });
      resultEl.textContent = "-";
      const meChoice = youEl.textContent || "-";
      statusEl.textContent = meChoice === "-" ? "Choose your move!" : "Waiting for opponent...";
      return;
    }

    // reveal authoritative picks & result
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
    // keep choices disabled until cleared
    choiceButtons.forEach(b => { b.disabled = true; b.style.pointerEvents = "none"; });
  });
  activeUnsubscribes.push(unsubRound);

  /* ---------------- room history listener (per-room) ---------------- */
  const unsubRoomHistory = onValue(roomHistoryRef, (snap) => {
    const val = snap.val() || {};
    const arr = Object.values(val).sort((a,b) => (b.timestamp||0)-(a.timestamp||0));
    roomHistoryEl.innerHTML = "";
    for (const e of arr) {
      const li = document.createElement("li");
      const p1 = e.player1Name || e.player1Id || "P1";
      const p2 = e.player2Name || e.player2Id || "P2";
      const outcome = e.winnerId ? (e.winnerId === e.player1Id ? `${p1} won` : `${p2} won`) : "It's a tie!";
      li.textContent = `${p1}: ${e.player1Choice} vs ${p2}: ${e.player2Choice} → ${outcome}`;
      roomHistoryEl.appendChild(li);
    }
  });
  activeUnsubscribes.push(unsubRoomHistory);

  /* ---------------- global history (live match log) listener --------------
     ensure front page and room both show the global live feed (if present)
  */
  const globalRef = ref(db, "rps/globalHistory");
  const unsubGlobal = onValue(globalRef, (snap) => {
    const val = snap.val() || {};
    const arr = Object.values(val).sort((a,b) => (b.timestamp||0)-(a.timestamp||0));
    // render a live feed element if present on page
    const liveEl = document.getElementById("live-match-log");
    if (liveEl) {
      liveEl.innerHTML = "";
      for (const e of arr) {
        const li = document.createElement("li");
        const p1 = e.player1Name || e.player1Id || "P1";
        const p2 = e.player2Name || e.player2Id || "P2";
        const outcome = e.winnerId ? (e.winnerId === e.player1Id ? `${p1} won` : `${p2} won`) : "It's a tie!";
        li.textContent = `${p1}: ${e.player1Choice} vs ${p2}: ${e.player2Choice} → ${outcome}`;
        liveEl.appendChild(li);
      }
    }
  });
  activeUnsubscribes.push(unsubGlobal);
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
