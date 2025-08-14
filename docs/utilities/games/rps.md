# Pokémon Duel: Grass 🔹 Fire 🔥 Water 💧

<div id="rps-app" class="rps-container">
  <!-- Header / Cover -->
  <div class="rps-header">
    <img src="/many/assets/img/pokemon-cover.png" alt="Pokémon Duel" />
  </div>

  <!-- Main content grid -->
  <div class="rps-main-grid">
    <!-- Left column: Room creation/join -->
    <div class="rps-left">
      <div class="rps-room-setup">
        <input type="text" id="player-name-input" placeholder="Trainer Name" />
        <input type="text" id="room-id-input" placeholder="Room Name" />
        <button id="create-room-btn">Create | Join</button>
      </div>
    </div>

    <!-- Right column: Scoreboard / History -->
    <div class="rps-right">
      <h3>Live Match Log</h3>
      <ul id="game-history"></ul>
    </div>
  </div>

  <!-- Room Game UI (hidden initially) -->
  <div class="rps-game-ui" id="rps-ui" style="display:none;">
    <h2 id="room-title"></h2>
    <button id="copy-link-btn">Copy Room Link</button>

    <div class="rps-choices">
      <button data-choice="grass">🌿 Grass</button>
      <button data-choice="fire">🔥 Fire</button>
      <button data-choice="water">💧 Water</button>
    </div>

    <div class="rps-result">
      <p>You chose: <span id="you-choice">-</span></p>
      <p>Opponent chose: <span id="opponent-choice">-</span></p>
      <p>Round Result: <strong id="round-result">-</strong></p>
      <button id="play-again-btn">Play Again</button>
    </div>

    <h3>Scoreboard</h3>
    <ul id="scoreboard"></ul>
  </div>
</div>

<link rel="stylesheet" href="/many/assets/css/utilities/games/rps/rps.css" />
<script type="module" src="/many/assets/js/utilities/rps/rps.js"></script>
