---
hide:
  - title
---

<div id="oracle-bg"></div>
<canvas id="rune-canvas"></canvas>

<div id="oracle-room">
  <div class="candles-background"></div>
  <div class="oracle-layout">
    <div class="oracle-content-wrapper">
      <div class="oracle-left">
        <div class="oracle-wrapper">
          <img id="oracle-img" src="/many/assets/img/oracle/normal-ditto.png" alt="Oracle" />
          <div id="oracle-mood-glow"></div>
        </div>
        <div id="chat-area">
          <div id="chat-log"></div>
          <form id="chat-form">
            <input type="text" id="user-input" placeholder="Ask the oracle..." autocomplete="off" />
            <button type="submit">🔮</button>
          </form>
        </div>
      </div>
      <div id="oracle-extra" class="hidden">
        <h2 id="extra-header"></h2>
        <div id="extra-body"></div>
        <div id="extra-footer"></div>
      </div>
    </div>
  </div>

</div>

<link rel="stylesheet" href="/many/assets/css/oracle/oracle.css">
<script defer src="/many/assets/js/oracle/oracle.js"></script>