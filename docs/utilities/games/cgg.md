---
title: Hangmon
hide:
  - toc
---

<div id="game-container">
<canvas class="game"></canvas>
</div>
<div id="controls">
  <div>
    <button id="forward">▲</button>
    <button id="left">◀</button>
    <button id="backward">▼</button>
    <button id="right">▶</button>
  </div>
</div>
<div id="score">0</div>
<div id="result-container">
  <div id="result">
    <h1>Game Over</h1>
    <p>Your score: <span id="final-score"></span></p>
    <button id="retry">Retry</button>
  </div>
</div>

<link rel="stylesheet" href="/many/assets/css/utilities/games/cgg/cgg.css" />
<script type="module" src="/many/assets/js/utilities/games/cgg/cgg.js"></script>