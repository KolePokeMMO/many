/* Clean rebuild — GitHub Pages hash routing, atomic rounds with roundId, no spam, reliable Play Again */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, update, push, onValue, get, runTransaction, onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ---------------- Firebase ---------------- */
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

/* ---------------- Helpers ---------------- */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const choiceEmoji = { grass:"🌿", fire:"🔥", water:"💧" };

function beats(a, b) {
  return (a==="grass" && b==="water") ||
         (a==="water" && b==="fire") ||
         (a==="fire" && b==="grass");
}
function decide(a,b){ if(a===b) return 0; return beats(a,b) ? 1 : 2; }

function getRoomFromHash() {
  const h = location.hash;
  if (!h.startsWith("#/room/")) return null;
  return decodeURIComponent(h.split("/")[2] || "");
}

function uid() { return (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) }

/* Strict per-round choice: { roundId, pick|null } so stale writes don’t leak */
async function setPlayerChoice(room, playerId, name, roundId, pick) {
  const playerRef = ref(db, `rps/rooms/${room}/players/${playerId}`);
  await set(playerRef, { name, choice: { roundId, pick } });
}

/* ---------------- DOM boot ---------------- */
function ensureShell() {
  const app = document.getElementById("rps-app");
  if (!app) {
    const div = document.createElement("div");
    div.id = "rps-app";
    div.className = "rps-container";
    document.body.appendChild(div);
    return div;
  }
  return app;
}

/* ---------------- Front page ---------------- */
function drawFrontPage() {
  const app = ensureShell();
  app.innerHTML = `
    <div class="rps-header">
      <img src="/many/assets/img/pokemon-cover.jpg" alt="Pokémon Duel Cover" onerror="this.style.display='none'">
    </div>

    <div class="rps-main-grid">
      <div class="rps-card">
        <h3>Create / Join Room</h3>
        <div class="rps-room-setup">
          <input id="fp-name" placeholder="Your Trainer Name" />
          <input id="fp-room" placeholder="Room Name" />
          <button id="fp-join">Create / Join</button>
        </div>
      </div>

      <div class="rps-card">
        <h3>Scoring Log (all rooms)</h3>
        <ul id="global-scoring-log"></ul>
      </div>
    </div>

    <div id="rps-room"></div>
  `;

  $("#fp-join").addEventListener("click", () => {
    const name = ($("#fp-name").value || "").trim();
    const room = ($("#fp-room").value || "").trim();
    if (!name || !room) { alert("Enter name and room."); return; }
    localStorage.setItem(`rps-name-${room}`, name);
    location.hash = `#/room/${encodeURIComponent(room)}`;
    drawRoom(room);
  });

  // Show global scoring log (summaries across rooms)
  attachGlobalScoringLog();
}

/* ---------------- Global Scoring Log (right column) ---------------- */
function attachGlobalScoringLog() {
  const roomsRef = ref(db, `rps/rooms`);
  const ul = $("#global-scoring-log");
  onValue(roomsRef, (snap) => {
    const rooms = snap.val() || {};
    const summaries = [];

    for (const [room, data] of Object.entries(rooms)) {
      const hist = data.history || {};
      const playersMap = (data.players || {});
      // Compute quick summary
      let games = 0, p1Total = 0, p2Total = 0, lastWinner = "—";
      const names = new Set(Object.values(playersMap).map(p => p?.name).filter(Boolean));
      for (const h of Object.values(hist)) {
        games++;
        if (h.winnerId) {
          lastWinner = (h.winnerId === h.player1Id) ? (h.player1Name || "P1") : (h.player2Name || "P2");
        }
      }
      summaries.push({
        room,
        players: Array.from(names).slice(0, 2).join(" vs "),
        games,
        lastWinner
      });
    }

    summaries.sort((a,b)=> b.games - a.games);
    ul.innerHTML = "";
    for (const s of summaries.slice(0, 30)) {
      const li = document.createElement("li");
      li.textContent = `${s.players || s.room} — Games: ${s.games} — Last winner: ${s.lastWinner}`;
      ul.appendChild(li);
    }
  });
}

/* ---------------- Room UI ---------------- */
async function drawRoom(room) {
  const app = ensureShell();
  const node = $("#rps-room", app);
  node.innerHTML = `
    <div class="rps-card">
      <div class="rps-room-top">
        <div class="rps-room-title">Room: ${room}</div>
        <div class="rps-actions">
          <button class="rps-btn" id="copy-link">Copy Room Link</button>
        </div>
      </div>
      <div class="rps-players" id="players-line">Players: <em>waiting…</em></div>

      <div class="rps-choices">
        <button class="rps-btn" data-choice="grass">${choiceEmoji.grass} Grass</button>
        <button class="rps-btn" data-choice="fire">${choiceEmoji.fire} Fire</button>
        <button class="rps-btn" data-choice="water">${choiceEmoji.water} Water</button>
        <button class="rps-btn" id="play-again" style="margin-left: .5rem;">Play Again</button>
      </div>

      <div class="rps-status" id="status">Choose your move!</div>
      <div class="rps-result" id="result-line">
        You: <span id="you">-</span> &nbsp;|&nbsp; Opponent: <span id="opp">-</span> &nbsp;|&nbsp;
        Result: <span id="res">-</span>
      </div>

      <div class="rps-split">
        <div class="rps-list">
          <h4>Live Match Log</h4>
          <ul id="live-log"></ul>
        </div>
        <div class="rps-list">
          <h4>Game History (this room)</h4>
          <ul id="history"></ul>
        </div>
      </div>
    </div>
  `;

  /* ------- Identity & refs ------- */
  const nameKey = `rps-name-${room}`;
  const idKey = `rps-id-${room}`;
  const myName = localStorage.getItem(nameKey) || prompt("Your Trainer Name?") || `Trainer-${Math.random().toString(36).slice(2,7)}`;
  localStorage.setItem(nameKey, myName);

  let myId = localStorage.getItem(idKey);
  if (!myId) { myId = uid(); localStorage.setItem(idKey, myId); }

  const roomRef         = ref(db, `rps/rooms/${room}`);
  const playersRef      = ref(db, `rps/rooms/${room}/players`);
  const meRef           = ref(db, `rps/rooms/${room}/players/${myId}`);
  const currentRoundRef = ref(db, `rps/rooms/${room}/currentRound`);
  const historyRef      = ref(db, `rps/rooms/${room}/history`);

  // Join room (presence)
  await set(meRef, { name: myName, choice: { roundId: null, pick: null }, joinedAt: Date.now() });
  onDisconnect(meRef).remove();

  // Ensure currentRound exists with a roundId
  await runTransaction(currentRoundRef, (cur) => {
    if (!cur || !cur.roundId) {
      return { roundId: uid(), status: "waiting", createdAt: Date.now() };
    }
    return cur;
  });

  /* ------- UI elements ------- */
  const statusEl  = $("#status");
  const youEl     = $("#you");
  const oppEl     = $("#opp");
  const resEl     = $("#res");
  const liveLog   = $("#live-log");
  const histList  = $("#history");
  const playersLine = $("#players-line");
  const playAgainBtn = $("#play-again");
  const copyBtn      = $("#copy-link");
  const choiceBtns   = $$(".rps-choices .rps-btn[data-choice]");

  /* ------- Copy link ------- */
  copyBtn.addEventListener("click", () => {
    const url = `${location.origin}${location.pathname}#/room/${encodeURIComponent(room)}`;
    navigator.clipboard.writeText(url).then(()=>{
      statusEl.textContent = "Room link copied!";
    }).catch(()=>{ statusEl.textContent = "Copy failed — copy manually."; });
  });

  /* ------- Enable/disable helpers ------- */
  const setChoicesEnabled = (v) => {
    choiceBtns.forEach(b => b.disabled = !v);
  };

  /* ------- Listen: players (list + opp detection) ------- */
  onValue(playersRef, (snap) => {
    const players = snap.val() || {};
    const entries = Object.entries(players);
    // players list line
    const parts = entries.map(([pid,p]) => {
      const nm = p?.name || "Unknown";
      return pid === myId ? `<span class="you">${nm} (you)</span>` : nm;
    });
    playersLine.innerHTML = `Players: ${parts.length ? parts.join(" • ") : "<em>waiting…</em>"}`;

    // Update “opp” label visibility only after both choose in same round (handled below)
  });

  /* ------- Core: choices & finishing (per roundId) ------- */
  let currentRoundId = null;

  // Keep currentRoundId in sync
  onValue(currentRoundRef, (snap) => {
    const cur = snap.val();
    if (!cur) return;
    currentRoundId = cur.roundId;

    // When a round is finished, show result; when awaiting, reset UI message
    if (cur.status === "finished") {
      // UI is updated via history push below
      setChoicesEnabled(true);   // allow picking for next round after Play Again
      playAgainBtn.disabled = false;
    } else {
      // waiting
      statusEl.textContent = "Choose your move!";
      resEl.textContent = "-";
    }
  });

  // Click to choose (records ONLY for current roundId)
  choiceBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!currentRoundId) return;
      setChoicesEnabled(false); // prevent double clicks
      const pick = btn.dataset.choice;
      await setPlayerChoice(room, myId, myName, currentRoundId, pick);
      youEl.textContent = `${choiceEmoji[pick]} ${pick}`;
      statusEl.textContent = "Locked. Waiting for opponent…";
      // Re-enable; we’ll lock again when evaluating
      setChoicesEnabled(true);
    });
  });

  // Evaluate when BOTH picks exist for the SAME roundId.
  onValue(playersRef, async (snap) => {
    const players = snap.val() || {};
    const ids = Object.keys(players);
    if (ids.length < 2 || !currentRoundId) {
      oppEl.textContent = "-";
      return;
    }

    // Find an opponent
    const oppId = ids.find(id => id !== myId);
    const me    = players[myId];
    const opp   = players[oppId];

    const myChoice  = me?.choice || { roundId: null, pick: null };
    const oppChoice = opp?.choice || { roundId: null, pick: null };

    // Only reveal opponent AFTER both picks are in for this roundId
    const bothChosenSameRound = (myChoice.roundId === currentRoundId && myChoice.pick) &&
                                (oppChoice.roundId === currentRoundId && oppChoice.pick);

    youEl.textContent = myChoice.pick ? `${choiceEmoji[myChoice.pick]} ${myChoice.pick}` : "-";
    oppEl.textContent = bothChosenSameRound ? `${choiceEmoji[oppChoice.pick]} ${oppChoice.pick}` : "-";

    if (!bothChosenSameRound) {
      statusEl.textContent = myChoice.pick ? "Waiting for opponent…" : "Choose your move!";
      resEl.textContent = "-";
      return;
    }

    // Try to finish atomically ONCE per round using a transaction
    const aId = ids[0], bId = ids.find(i => i !== aId) || ids[1];
    const a   = players[aId]; const b = players[bId];

    const roundPayload = {
      roundId: currentRoundId,
      status: "finished",
      player1Id: aId,
      player2Id: bId,
      player1Name: a?.name || "P1",
      player2Name: b?.name || "P2",
      player1Choice: a?.choice?.pick || null,
      player2Choice: b?.choice?.pick || null,
      winnerId: (()=>{
        const who = decide(a?.choice?.pick, b?.choice?.pick);
        return who === 0 ? null : (who === 1 ? aId : bId);
      })(),
      timestamp: Date.now()
    };

    try {
      const tr = await runTransaction(currentRoundRef, (cur) => {
        // Only finish if we are still on the same round and not finished
        if (!cur || cur.roundId !== currentRoundId) return cur;
        if (cur.status === "finished") return; // abort
        return roundPayload;
      }, { applyLocally: false });

      if (tr.committed) {
        // We are the winner of the transaction -> push to history exactly once
        await push(historyRef, roundPayload);
      }
      // Either way, UI will update below via history listener
    } catch (e) {
      console.error("Round finish transaction failed:", e);
    }
  });

  /* ------- History (room only) + Live Log ------- */
  onValue(historyRef, (snap) => {
    const hist = snap.val() || {};
    const entries = Object.values(hist).sort((a,b)=> (b.timestamp||0) - (a.timestamp||0));

    // Game History list
    histList.innerHTML = "";
    for (const e of entries) {
      const outcome = e.winnerId
        ? (e.winnerId === e.player1Id ? `${e.player1Name} won` : `${e.player2Name} won`)
        : "It's a tie!";
      const li = document.createElement("li");
      li.textContent = `${e.player1Name}: ${e.player1Choice} vs ${e.player2Name}: ${e.player2Choice} → ${outcome}`;
      histList.appendChild(li);
    }

    // Live Match Log = most recent entry
    liveLog.innerHTML = "";
    if (entries[0]) {
      const e = entries[0];
      const outcome = e.winnerId
        ? (e.winnerId === e.player1Id ? `${e.player1Name} won` : `${e.player2Name} won`)
        : "It's a tie!";
      const li = document.createElement("li");
      li.textContent = `${e.player1Name}: ${e.player1Choice} vs ${e.player2Name}: ${e.player2Choice} → ${outcome}`;
      liveLog.appendChild(li);

      // Also update the prominent “Result” line
      const amP1 = e.player1Id === myId;
      const myPick   = amP1 ? e.player1Choice : e.player2Choice;
      const theirPick= amP1 ? e.player2Choice : e.player1Choice;
      youEl.textContent = `${choiceEmoji[myPick]} ${myPick}`;
      oppEl.textContent = `${choiceEmoji[theirPick]} ${theirPick}`;

      if (!e.winnerId) { resEl.textContent = "It's a tie!"; resEl.className = "tie"; }
      else if (e.winnerId === myId) { resEl.textContent = "You win!"; resEl.className = "win"; }
      else { resEl.textContent = "You lose!"; resEl.className = "lose"; }

      statusEl.textContent = "Round finished!";
      playAgainBtn.disabled = false;
      setChoicesEnabled(true);
    }
  });

  /* ------- Play Again: advance roundId, keep choices bound to new round ------- */
  playAgainBtn.addEventListener("click", async () => {
    playAgainBtn.disabled = true;
    setChoicesEnabled(false);
    youEl.textContent = "-";
    oppEl.textContent = "-";
    resEl.textContent = "-";
    statusEl.textContent = "Starting next round…";

    try {
      // Advance the round atomically; only if we’re still on the same finished round
      const newId = uid();
      await runTransaction(currentRoundRef, (cur) => {
        // Always allow advancing to a new round id
        return { roundId: newId, status: "waiting", createdAt: Date.now() };
      });
      // Reset ONLY my choice (opponent handles their own)
      await setPlayerChoice(room, myId, myName, newId, null);
      currentRoundId = newId;

      statusEl.textContent = "Choose your move!";
      setChoicesEnabled(true);
    } catch (e) {
      console.error("Play again failed:", e);
      statusEl.textContent = "Play Again failed. Try refresh.";
      playAgainBtn.disabled = false;
      setChoicesEnabled(true);
    }
  });
}

/* ---------------- Router ---------------- */
function boot() {
  const room = getRoomFromHash();
  drawFrontPage();
  if (room) drawRoom(room);
}
window.addEventListener("hashchange", () => {
  boot();
});
boot();
