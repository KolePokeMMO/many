---
hide:
  - title
---

<div id="oracle-bg"></div>
<div class="fog-overlay"></div>
<canvas id="rune-canvas"></canvas>

<div id="oracle-room">
  <div class="candles-background"></div>

  <span class="floating-rune" style="top:10%; left:5%;">ᚠ</span>
  <span class="floating-rune" style="top:40%; left:80%;">ᚢ</span>
  <span class="floating-rune" style="top:60%; left:30%;">ᚨ</span>

  <div class="oracle-layout">
    <div class="oracle-left">
      <div class="oracle-wrapper">
        <img id="oracle-img" src="/many/assets/img/oracle/shiny-ditto.png" alt="Oracle" />
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
