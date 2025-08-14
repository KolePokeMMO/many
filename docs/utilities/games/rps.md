# Rock, Paper, Scissors

<div id="rps-app" class="rps-container">
  <h1>Rock Paper Scissors Duel</h1>

  <div class="setup">
    <input type="text" id="player-name-input" placeholder="Enter your name" />
    <input type="text" id="room-id-input" placeholder="Enter Room ID" />
    <button id="create-room-btn">Create Room</button>
    <button id="join-room-btn">Join Room</button>
  </div>

  <div class="rps-game" id="rps-ui" style="display: none;">
    <div class="name-display" id="player-name-display"></div>
    <div class="rps-buttons">
      <button data-choice="rock">🪨 Rock</button>
      <button data-choice="paper">📄 Paper</button>
      <button data-choice="scissors">✂️ Scissors</button>
    </div>
    <div class="result" id="result-text"></div>

    <div class="history">
      <h3>Game History</h3>
      <ul id="game-history"></ul>
    </div>
  </div>
</div>

<link rel="stylesheet" href="/many/assets/css/utilities/games/rps/rps.css" />
<script type="module" src="/many/assets/js/utilities/rps/rps.js"></script>
