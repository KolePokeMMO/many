// oracle.js — Cleaned & Organised for maximum cuddles and code clarity 💙

const chatLog = document.getElementById("chat-log");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const moodGlow = document.getElementById("oracle-mood-glow");
const oracleImg = document.getElementById("oracle-img");

let oracleData = [];

// — Load Oracle Answers from JSON file
fetch("/many/assets/data/oracle-answers.json")
  .then(response => response.json())
  .then(data => oracleData = data)
  .catch(err => console.error("Failed to load oracle data:", err));

/**
 * Generate Oracle's response based on user input keywords.
 * Returns an object with text, mood, and optional extra info.
 */
function generateOracleResponse(input) {
  input = input.toLowerCase();

  for (const entry of oracleData) {
    if (entry.keywords.some(keyword => input.includes(keyword))) {
      return {
        text: entry.response,
        mood: entry.mood || "happy",
        extra: entry.extra
      };
    }
  }

  // Default fallback response
  return {
    text: "Hmm... I do not know that answer. Come back with knowledge.",
    mood: "confused"
  };
}

/**
 * Types out the oracle's message letter by letter.
 * Supports HTML tags by typing only plain text, then replacing with full HTML after typing.
 */
function typeMessage(text) {
  const msgEl = document.createElement("div");
  msgEl.className = "message oracle";
  chatLog.appendChild(msgEl);

  const plainText = text.replace(/<[^>]*>?/gm, ""); // Strip HTML tags for typing effect
  let i = 0;

  function step() {
    if (i < plainText.length) {
      msgEl.textContent += plainText[i++];
      chatLog.scrollTop = chatLog.scrollHeight;
      setTimeout(step, 40);
    } else {
      // After typing finished, replace with original text (including HTML)
      msgEl.innerHTML = text;
    }
  }

  step();
}

/**
 * Sets the mood glow element's class to reflect the current mood.
 */
function setMood(mood) {
  moodGlow.className = ""; // reset
  moodGlow.classList.add(`mood-${mood}`);
}

/**
 * Changes oracle's facial expression with morph animation,
 * then resets back to idle after 10 seconds.
 */
function changeExpression(mood) {
  const moodMap = {
    happy: "/many/assets/img/oracle/happy-eevee.png",
    angry: "/many/assets/img/oracle/angry-pikachu.png",
    confused: "/many/assets/img/oracle/confused-psyduck.png",
    smug: "assets/img/oracle/smug.png",
    idle: "/many/assets/img/oracle/shiny-ditto.png",
  };

  // Trigger morph animation by reflow trick
  oracleImg.classList.remove("morphing");
  void oracleImg.offsetWidth; // force reflow
  oracleImg.classList.add("morphing");

  oracleImg.src = moodMap[mood] || moodMap.idle;

  // Reset to idle after 10 seconds with morph animation
  setTimeout(() => {
    oracleImg.classList.remove("morphing");
    void oracleImg.offsetWidth;
    oracleImg.classList.add("morphing");
    oracleImg.src = moodMap.idle;

    moodGlow.className = ""; // remove mood glow

    setTimeout(() => {
      oracleImg.classList.remove("morphing");
    }, 600); // animation duration
  }, 6000);
}

/**
 * Summons floating Unown Pokémon images scattered randomly in the oracle room.
 * Has a chance to spawn shiny versions based on configurable shinyChance.
 */
function summonRunes() {
  const container = document.getElementById("oracle-room");
  const shinyChance = 0.5; // ~1.22% shiny chance

  for (let i = 0; i < 15; i++) {
    const rune = document.createElement("div");
    rune.className = "floating-rune";
    rune.style.top = `${Math.random() * 100}%`;
    rune.style.left = `${Math.random() * 100}%`;

    // Choose a base Unown index (1 to 28) — representing A to ? (non-shiny)
    const base = Math.floor(Math.random() * 28);
    let imgIndex = 1 + base * 2; // starts at 1, 3, 5, ..., 55

    // If shiny triggers, use the even number (shiny counterpart)
    if (Math.random() < shinyChance) {
      console.log(`✨ Shiny Unown-${imgIndex} appeared!`);
      imgIndex += 1; // switch to shiny (2, 4, 6, ..., 56)
    }

    const img = document.createElement("img");
    img.src = `/many/assets/img/oracle/unowns/unown-${imgIndex}.png`;
    img.alt = `Unown ${imgIndex}`;
    img.className = "floating-unown";

    rune.appendChild(img);
    container.appendChild(rune);
  }
}



/**
 * Initializes the rune canvas animation with floating rune characters.
 */
function initRuneCanvas() {
  const canvas = document.getElementById("rune-canvas");
  const ctx = canvas.getContext("2d");
  let width, height;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resize);
  resize();

  class Rune {
    constructor() {
      this.x = Math.random() * width;
      this.y = height + Math.random() * 200;
      this.char = String.fromCharCode(0x16A0 + Math.floor(Math.random() * 32));
      this.speed = 0.3 + Math.random() * 0.7;
      this.alpha = 0.1 + Math.random() * 0.2;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.font = "24px serif";
      ctx.fillStyle = "#8E2DE2";
      ctx.fillText(this.char, this.x, this.y);
      ctx.restore();

      this.y -= this.speed;
      if (this.y < -20) {
        this.y = height + 20;
        this.x = Math.random() * width;
      }
    }
  }

  const runes = Array.from({ length: 50 }, () => new Rune());

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (const rune of runes) {
      rune.draw();
    }
    requestAnimationFrame(animate);
  }

  animate();
}

/**
 * Shows the extra info panel with provided content.
 */
function showExtraPanel(extra) {
  const panel = document.getElementById("oracle-extra");
  const header = document.getElementById("extra-header");
  const body = document.getElementById("extra-body");
  const footer = document.getElementById("extra-footer");

  header.textContent = extra.header || "";
  body.textContent = extra.body || "";
  footer.textContent = extra.footer || "";

  panel.classList.add("visible");
  panel.classList.remove("hidden");
}

function hideExtraPanel() {
  const panel = document.getElementById("oracle-extra");
  panel.classList.remove("visible");

  // Optional: after fade out, add hidden class for accessibility / layout
  setTimeout(() => {
    panel.classList.add("hidden");
  }, 500); // match CSS transition duration
}


// Initialize runes and canvas animations after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  summonRunes();
  initRuneCanvas();
});

// Handle chat form submission
chatForm.addEventListener("submit", e => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  // Add user's message to chat log
  const userMsg = document.createElement("div");
  userMsg.className = "message user";
  userMsg.textContent = text;
  chatLog.appendChild(userMsg);

  chatLog.scrollTop = chatLog.scrollHeight;
  userInput.value = "";

  // Generate oracle reply
  const { text: reply, mood, extra } = generateOracleResponse(text);

  setMood(mood);
  changeExpression(mood);

  // Delay oracle typing and extra panel show for smoother experience
  setTimeout(() => {
    typeMessage(reply);
    if (extra) {
      showExtraPanel(extra);
    } else {
      hideExtraPanel();
    }
  }, 200);
});
