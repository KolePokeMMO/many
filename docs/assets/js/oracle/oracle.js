// oracle.js — Modular Q&A loader + chat UI

const chatLog   = document.getElementById("chat-log");
const chatForm  = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const moodGlow  = document.getElementById("oracle-mood-glow");
const oracleImg = document.getElementById("oracle-img");
const wrapper = document.querySelector(".oracle-content-wrapper");

// === Shiny Ditto Randomizer ===
const DITTO_NORMAL = "/many/assets/img/oracle/normal-ditto.png";
const DITTO_SHINY  = "/many/assets/img/oracle/shiny-ditto.png";

function maybeMakeDittoShiny() {
  const isShiny = Math.random() < 0.5; // 10% chance

  if (isShiny) {
    oracleImg.src = DITTO_SHINY;

    const sparkleWrapper = document.createElement("div");
    sparkleWrapper.className = "shiny-sparkle";

    for (let j = 0; j < 8; j++) {
      const star = document.createElement("div");
      star.className = "star";

      const angle = Math.random() * 2 * Math.PI;
      const dist = 90 + Math.random() * 60; // was 30–50, now 60–100

      star.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      star.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      star.style.setProperty("--star-size", 8 + Math.random() * 8 + "px"); // slightly larger stars
      star.style.setProperty("--star-duration", 800 + Math.random() * 400 + "ms");
      star.style.setProperty("--rot", Math.random() * 360 + "deg");
      star.style.animationDelay = Math.random() * 400 + "ms";

      sparkleWrapper.appendChild(star);
    }

    // Position relative to oracle image
    oracleImg.parentElement.appendChild(sparkleWrapper);
  } else {
    oracleImg.src = DITTO_NORMAL;
  }
}

maybeMakeDittoShiny();

let oracleData = [];

const MOODS = [
  "happy", "angry", "confused", "smug", "sad",
  "shocked", "bored", "mischievous", "idle"
];

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadOracleData() {
  try {
    const moodArrays = await Promise.all(
      MOODS.map(mood =>
        fetch(`/many/assets/data/oracle/${mood}.json`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => [])
      )
    );
    oracleData = moodArrays.flat();

    const fallback = await fetch(`/many/assets/data/oracle/fallback.json`)
      .then(res => res.ok ? res.json() : [])
      .catch(() => []);
    oracleData.push(...fallback);

    console.log(`Loaded Oracle data: ${oracleData.length} entries`);
  } catch (err) {
    console.error("Error loading Oracle data:", err);
  }
}

loadOracleData();

function generateOracleResponse(userInput) {
  const normalizedInput = normalize(userInput);
  const inputWords = normalizedInput.split(/\s+/);

  const synonymsMap = {
    "shiny": ["sparkly", "glossy", "rare"],
    "repel": ["repels", "repelling", "avoid"],
    "trainer": ["champion", "battler"],
    "tips": ["advice", "tricks", "guide"],
    "life": ["existence", "purpose", "meaning"],
    "use": ["how", "way", "method"]
  };

  function expandSynonyms(word) {
    const synonyms = synonymsMap[word] || [];
    return [word, ...synonyms];
  }

  function calculateConfidence(entryKeywords, inputWords) {
    let matchCount = 0;

    for (const keyword of entryKeywords) {
      const keyVariants = expandSynonyms(keyword.toLowerCase());

      if (inputWords.some(input => keyVariants.some(kv => input.includes(kv)))) {
        matchCount++;
      }
    }

    return matchCount / (entryKeywords.length || 1);
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const entry of oracleData) {
    if (!entry.keywords || !Array.isArray(entry.keywords)) continue;

    const confidence = calculateConfidence(entry.keywords, inputWords);

    if (confidence > bestScore) {
      bestMatch = entry;
      bestScore = confidence;
    }
  }

  console.groupCollapsed("🔍 Oracle Match Log");
  console.log("📝 Input:", userInput);
  console.log("💡 Matched Entry:", bestMatch ? bestMatch.response : "None");
  console.log("📈 Confidence Score:", bestScore.toFixed(2));
  if (!bestMatch || bestScore < 0.3) {
    console.warn("⚠️ No good match found. Falling back.");
  }
  console.groupEnd();

  if (!bestMatch || bestScore < 0.3) {
    const fallback = oracleData.find(e => e.fallback);
    return {
      text: fallback?.response || "I'm lost in translation…",
      mood: fallback?.mood || "confused",
      extra: fallback?.extra || null
    };
  }

  return {
    text: bestMatch.response,
    mood: bestMatch.mood || "idle",
    extra: bestMatch.extra || null
  };
}

function typeMessage(text) {
  const msgEl = document.createElement("div");
  msgEl.className = "message oracle";
  chatLog.appendChild(msgEl);

  const plainText = text.replace(/<[^>]*>?/gm, "");
  let i = 0;

  function step() {
    if (i < plainText.length) {
      msgEl.textContent += plainText[i++];
      chatLog.scrollTop = chatLog.scrollHeight;
      setTimeout(step, 40);
    } else {
      msgEl.innerHTML = text;
    }
  }

  step();
}

function setMood(mood) {
  moodGlow.className = "";
  moodGlow.classList.add(`mood-${mood}`);
}

function changeExpression(mood) {
  const moodVariants = {
    happy:       { prefix: "happy",       count: 5 },
    angry:       { prefix: "angry",       count: 5 },
    confused:    { prefix: "confused",    count: 5 },
    smug:        { prefix: "smug",        count: 5 },
    sad:         { prefix: "sad",         count: 5 },
    shocked:     { prefix: "shocked",     count: 5 },
    bored:       { prefix: "bored",       count: 5 },
    mischievous: { prefix: "mischievous", count: 5 },
    idle:        { prefix: "normal-ditto", count: 1 }
  };

  const info = moodVariants[mood] || moodVariants.idle;
  const idx  = Math.floor(Math.random() * info.count) + 1;
  const url  = `/many/assets/img/oracle/moods/${info.prefix}-${idx}.png`;

  oracleImg.classList.remove("morphing");
  void oracleImg.offsetWidth;
  oracleImg.classList.add("morphing");
  oracleImg.src = url;

  setTimeout(() => {
    oracleImg.classList.remove("morphing");
    void oracleImg.offsetWidth;
    oracleImg.classList.add("morphing");
    const idleInfo = moodVariants.idle;
    const idleIdx  = Math.floor(Math.random() * idleInfo.count) + 1;
    oracleImg.src = `/many/assets/img/oracle/moods/${idleInfo.prefix}-${idleIdx}.png`;

    moodGlow.className = "";
    setTimeout(() => oracleImg.classList.remove("morphing"), 600);
  }, 6000);
}

function summonRunes() {
  const container   = document.getElementById("oracle-room");
  const shinyChance = 1 / 100;

  for (let i = 0; i < 15; i++) {
    const rune = document.createElement("div");
    rune.className = "floating-rune";
    rune.style.top  = `${Math.random() * 100}%`;
    rune.style.left = `${Math.random() * 100}%`;

    const base = Math.floor(Math.random() * 28);
    let imgIndex = 1 + base * 2;
    const isShiny = Math.random() < shinyChance;
    if (isShiny) imgIndex++;

    const img = document.createElement("img");
    img.src = `/many/assets/img/oracle/unowns/unown-${imgIndex}.png`;
    img.alt = `Unown ${imgIndex}`;
    img.className = "floating-unown";
    rune.appendChild(img);

    if (isShiny) {
      const sparkleWrapper = document.createElement("div");
      sparkleWrapper.className = "shiny-sparkle";
      for (let j = 0; j < 8; j++) {
        const star = document.createElement("div");
        star.className = "star";
        const angle = Math.random() * 2 * Math.PI;
        const dist = 30 + Math.random() * 20;
        star.style.setProperty("--dx", Math.cos(angle) * dist + "px");
        star.style.setProperty("--dy", Math.sin(angle) * dist + "px");
        star.style.setProperty("--star-size", 4 + Math.random() * 4 + "px");
        star.style.setProperty("--star-duration", 800 + Math.random() * 400 + "ms");
        star.style.setProperty("--rot", Math.random() * 360 + "deg");
        star.style.animationDelay = Math.random() * 400 + "ms";
        sparkleWrapper.appendChild(star);
      }
      rune.appendChild(sparkleWrapper);
    }

    container.appendChild(rune);
  }
}

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
  (function animate() {
    ctx.clearRect(0, 0, width, height);
    runes.forEach(r => r.draw());
    requestAnimationFrame(animate);
  })();
}

function showOracleExtra(header, body, footer) {
  const extraPanel = document.getElementById("oracle-extra");
  const oracleLeft = document.querySelector(".oracle-left");

  document.getElementById("extra-header").textContent = header || '';
  document.getElementById("extra-body").innerHTML = body || '';
  document.getElementById("extra-footer").innerHTML = footer || '';

  oracleLeft.classList.add("slide-left");
  extraPanel.classList.remove("hidden");

  wrapper.classList.add("extra-visible");  // <-- add this class when extra is visible
  console.log("extra-visible toggled:", wrapper.classList.contains("extra-visible"));


  setTimeout(() => {
    extraPanel.classList.add("reveal");
  }, 50);
}

function hideExtraPanel() {
  const extraPanel = document.getElementById("oracle-extra");
  const oracleLeft = document.querySelector(".oracle-left");

  extraPanel.classList.remove("reveal");
  oracleLeft.classList.remove("slide-left");

  setTimeout(() => {
    extraPanel.classList.add("hidden");

    wrapper.classList.remove("extra-visible");  // <-- remove class when hidden
  }, 500);
}

document.addEventListener("DOMContentLoaded", () => {
  summonRunes();
  initRuneCanvas();

  // Start centered because extra panel is hidden initially
  wrapper.classList.remove("extra-visible");
  // So flex + justify-content:center works by default
});



chatForm.addEventListener("submit", e => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  const userMsg = document.createElement("div");
  userMsg.className = "message user";
  userMsg.textContent = text;
  chatLog.appendChild(userMsg);
  chatLog.scrollTop = chatLog.scrollHeight;
  userInput.value = "";

  const { text: reply, mood, extra } = generateOracleResponse(text);
  setMood(mood);
  changeExpression(mood);

  setTimeout(() => {
    typeMessage(reply);
    if (extra) {
      const { header, body, footer } = extra;
      showOracleExtra(header, body, footer);
    } else {
      hideExtraPanel();
    }
  }, 200);
});
