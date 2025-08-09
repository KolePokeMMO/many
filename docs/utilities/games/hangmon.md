---
title: Hangmon
hide:
  - toc
---

<div class="hangmon-container">

  <!-- Left Column: Image + Message box -->
  <div class="hangmon-left-column">
    <div class="image-placeholder">
      <!-- Put your image here -->
<div class="image-placeholder">
  <svg id="hangmon-svg" width="200" height="300" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <!-- Gallows -->
    <line x1="20" y1="280" x2="180" y2="280" stroke="#ccc" stroke-width="4"/>
    <line x1="50" y1="280" x2="50" y2="20" stroke="#ccc" stroke-width="4"/>
    <line x1="50" y1="20" x2="140" y2="20" stroke="#ccc" stroke-width="4"/>
    <line x1="140" y1="20" x2="140" y2="50" stroke="#ccc" stroke-width="4"/>

    <!-- Body parts (all hidden initially) -->
    <circle id="head" cx="140" cy="70" r="20" stroke="#ccc" stroke-width="4" fill="none" class="hidden"/>
    <line id="body" x1="140" y1="90" x2="140" y2="160" stroke="#ccc" stroke-width="4" class="hidden"/>
    <line id="left-arm" x1="140" y1="110" x2="110" y2="140" stroke="#ccc" stroke-width="4" class="hidden"/>
    <line id="right-arm" x1="140" y1="110" x2="170" y2="140" stroke="#ccc" stroke-width="4" class="hidden"/>
    <line id="left-leg" x1="140" y1="160" x2="120" y2="210" stroke="#ccc" stroke-width="4" class="hidden"/>
    <line id="right-leg" x1="140" y1="160" x2="160" y2="210" stroke="#ccc" stroke-width="4" class="hidden"/>
  </svg>
</div>
    </div>
    <div id="message-box" class="message-box hidden" role="alert" aria-live="polite"></div>
  </div>

  <!-- Middle Column: Login or Game -->
  <div class="hangmon-middle-column">
    <!-- Login / Start Screen -->
    <div class="hangmon-login" id="login-screen">
      <h2>Play Hangmon</h2>
      <p class="hangmon-description">
        Create a player by choosing a name and pin. Use the same login each time to track your score and compete.
      </p>
      <label>
        Name:
        <input type="text" id="player-name" maxlength="20" placeholder="Enter your name" autocomplete="off" />
      </label>
      <label>
        PIN:
        <input type="password" id="player-pin" maxlength="4" placeholder="4-digit PIN" autocomplete="off" />
      </label>
      <button id="start-game">Start Game</button>
    </div>
    <!-- Game Area (hidden until game starts) -->
    <div id="hangmon-game-wrapper" class="hidden">
      <div id="hangmon-game">
        <div id="word-display" aria-live="polite" aria-label="Word to guess">_ _ _ _ _ _ _</div>
        <div id="letter-buttons" aria-label="Letter choices" role="group" aria-describedby="instructions">
          <!-- Letter buttons dynamically generated here -->
        </div>
        <input
          type="text"
          id="guess-word"
          placeholder="Guess the whole word"
          maxlength="30"
          aria-label="Guess the whole word"
          autocomplete="off"
          spellcheck="false"
        />
        <button id="submit-guess">Submit</button>
        <div class="game-info" aria-live="polite">
          <div>Wrong Guesses: <span id="wrong-count">0</span></div>
          <div>Time: <span id="game-timer">0s</span></div>
        </div>
      </div>
    </div>

  </div>

  <!-- Right Column: Leaderboard -->
  <div id="leaderboard-wrapper" class="hangmon-right-column" aria-label="Leaderboard">
    <h2>Leaderboard</h2>
    <ul id="leaderboard">
      <!-- Leaderboard entries dynamically inserted here -->
    </ul>
  </div>

</div>

<link rel="stylesheet" href="/many/assets/css/utilities/games/hangmon/hangmon.css" />
<script type="module" src="/many/assets/js/utilities/games/hangmon/hangmon.js"></script>
