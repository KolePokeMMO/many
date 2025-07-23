# Rock, Paper, Scissors

<div id="rps-app" class="rps-container">
  <h1>Rock Paper Scissors Duel</h1>

  <div class="setup">
    <input type="text" id="player-name" placeholder="Enter your name" />
    <button onclick="createRoom()">Create Room</button>
    <input type="text" id="room-id" placeholder="Enter Room ID" />
    <button onclick="joinRoom()">Join Room</button>
  </div>

  <div class="rps-game" id="rps-ui" style="display: none;">
    <div class="name-display" id="player-name-display"></div>
    <div class="rps-buttons">
      <button onclick="makeChoice('rock')">🪨 Rock</button>
      <button onclick="makeChoice('paper')">📄 Paper</button>
      <button onclick="makeChoice('scissors')">✂️ Scissors</button>
    </div>
    <div class="result" id="result-text"></div>

    <div class="history">
      <h3>Game History</h3>
      <ul id="game-history"></ul>
    </div>
  </div>
</div>

<script type="module" src="/many/assets/js/utilities/rps/rps.js"></script>
