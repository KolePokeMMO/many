/**
 * oracle.js — Professionalized Q&A Loader + Interactive Chat UI
 * Description: Interactive oracle powered by mood-based responses, visual feedback, and UI suggestions.
 */

// === DOM References ===
const chatLog   = document.getElementById("chat-log");
const chatForm  = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const moodGlow  = document.getElementById("oracle-mood-glow");
const oracleImg = document.getElementById("oracle-img");
const wrapper   = document.querySelector(".oracle-content-wrapper");

const debugMode = window.location.search.includes("debug=true");

// === Ditto Image Constants ===
const DITTO_NORMAL = "/many/assets/img/oracle/normal-ditto.png";
const DITTO_SHINY  = "/many/assets/img/oracle/shiny-ditto.png";

// === Mood Types ===
const MOODS = [
  "happy", "angry", "confused", "smug", "sad",
  "shocked", "bored", "mischievous", "idle"
];

// === Oracle Response Data Store ===
let oracleData = [];

// === Store last oracle entry from suggestion click ===
let lastOracleEntry = null;

// === Function: Normalize Text for Matching ===
function normalize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// === Function: Randomly Make Ditto Shiny with Sparkles ===
function maybeMakeDittoShiny() {
  const isShiny = Math.random() < 0.1; // 10% chance
  oracleImg.src = isShiny ? DITTO_SHINY : DITTO_NORMAL;

  if (isShiny) {
    const sparkleWrapper = document.createElement("div");
    sparkleWrapper.className = "shiny-sparkle";

    for (let j = 0; j < 8; j++) {
      const star = document.createElement("div");
      star.className = "star";

      const angle = Math.random() * 2 * Math.PI;
      const dist = 90 + Math.random() * 60;

      star.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      star.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      star.style.setProperty("--star-size", 8 + Math.random() * 8 + "px");
      star.style.setProperty("--star-duration", 800 + Math.random() * 400 + "ms");
      star.style.setProperty("--rot", Math.random() * 360 + "deg");
      star.style.animationDelay = Math.random() * 400 + "ms";

      sparkleWrapper.appendChild(star);
    }

    oracleImg.parentElement.appendChild(sparkleWrapper);
  }
}

// === Synonyms Map for Query Expansion ===
const synonymsMap = {
  shiny: ["sparkly", "glossy", "rare"],
  repel: ["repels", "repelling", "avoid"],
  trainer: ["champion", "battler"],
  tips: ["advice", "tricks", "guide"],
  life: ["existence", "purpose", "meaning"],
  use: ["how", "way", "method"]
};

// === Function: Expand Query Term with Synonyms ===
function expandSynonyms(word) {
  return [word, ...(synonymsMap[word] || [])];
}

// === Function: Load Oracle Response Data from JSON ===
async function loadOracleData() {
  try {
    const moodFiles = await Promise.all(
      MOODS.map(mood =>
        fetch(`/many/assets/data/oracle/${mood}.json`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => [])
      )
    );

    oracleData = moodFiles.flat();

    const fallback = await fetch(`/many/assets/data/oracle/fallback.json`)
      .then(res => res.ok ? res.json() : [])
      .catch(() => []);

    oracleData.push(...fallback);

    if (debugMode) {
      console.info(`✅ Oracle data loaded: ${oracleData.length} entries`);
    }
  } catch (error) {
    console.error("❌ Failed to load Oracle data:", error);
  }
}

// === Function: Calculate Confidence Score Between Input and Entry ===
function calculateConfidence(entryKeywords, inputWords, normalizedInput) {
  const stem = (word) => word.replace(/ies$/, 'y').replace(/s$/, '');
  const inputStems = inputWords.map(stem);
  let matchScore = 0;

  for (const keyword of entryKeywords) {
    const variants = expandSynonyms(keyword.toLowerCase());
    for (const variant of variants) {
      const normKV = normalize(variant);
      const kvStems = normKV.split(/\s+/).map(stem);

      const fullPhraseMatch = new RegExp(`\\b${normKV}\\b`).test(normalizedInput);
      const allStemsMatch  = kvStems.every(stemmed => inputStems.includes(stemmed));
      const anyStemMatch   = kvStems.some(stemmed => inputStems.includes(stemmed));

      if (fullPhraseMatch) {
        matchScore += 1;
        break;
      } else if (allStemsMatch) {
        matchScore += 0.75;
        break;
      } else if (anyStemMatch) {
        matchScore += 0.5;
        break;
      }
    }
  }

  return matchScore / (entryKeywords.length || 1);
}

// === Function: Generate Oracle Response Based on Input ===
function generateOracleResponse(userInputText) {
  const normalizedInput = normalize(userInputText);
  const inputWords = normalizedInput.split(/\s+/);

  let bestMatch = null;
  let bestScore = 0;
  const scoredEntries = [];

  for (const entry of oracleData) {
    if (!entry.keywords || !Array.isArray(entry.keywords)) continue;

    const confidence = calculateConfidence(entry.keywords, inputWords, normalizedInput);
    if (confidence > 0) {
      scoredEntries.push({ entry, confidence });
    }

    if (confidence > bestScore) {
      bestMatch = entry;
      bestScore = confidence;
    }
  }

  // Sort matches and get top suggestions
  scoredEntries.sort((a, b) => b.confidence - a.confidence);
  const topMatches = scoredEntries.slice(0, 5).filter(item => item.confidence > 0.15);

  if (debugMode) {
    console.groupCollapsed("🔍 Oracle Matching Debug");
    console.log("Input:", userInputText);
    console.log("Top Match:", bestMatch?.response || "None");
    console.log("Score:", bestScore.toFixed(2));
    console.groupEnd();
  }

  // === Fallback behavior if no strong match ===
  if (!bestMatch || bestScore < 0.15) {
    const fallback = oracleData.find(e => e.fallback);
    return {
      text: fallback?.response || "I'm unable to interpret your question.",
      mood: fallback?.mood || "confused",
      extra: fallback?.extra || null
    };
  }

  // === Suggestion panel logic ===
  let extra = bestMatch.extra || null;

  if (topMatches.length > 1) {
    const emojiMap = {
      happy: "😊", angry: "😠", confused: "😕", smug: "😏",
      sad: "😢", shocked: "😲", bored: "😐", mischievous: "😈", idle: "✨"
    };

    const suggestionItems = topMatches.map(({ entry, confidence }) => {
      const label = (entry.original || entry.keywords?.join(" ") || "Ask").replace(/"/g, '&quot;');
      const mood = entry.mood || "idle";
      const emoji = emojiMap[mood] || "🌀";
      const percent = Math.round(confidence * 100);

      // Use data-id for unique identification
      return `<li>
        <button class="suggestion-button" data-id="${entry.id}" role="button" tabindex="0">
          <span class="icon">${emoji}</span>
          <span class="label">${label}</span>
          <span class="confidence">${percent}%</span>
        </button>
      </li>`;
    }).join("");

    extra = {
      header: "Other possible responses:",
      body: `<ul class="suggestion-list">${suggestionItems}</ul>`,
      footer: `<p class="hint">Select a suggestion to ask again.</p>`
    };
  }

  return {
    text: bestMatch.response,
    mood: bestMatch.mood || "idle",
    extra
  };
}

// === Function: Simulate Typing Animation for Oracle Response ===
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

// === Function: Update Mood Glow Indicator ===
function setMood(mood) {
  moodGlow.className = "";
  moodGlow.classList.add(`mood-${mood}`);
}

// === Function: Change Ditto Expression Based on Mood ===
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
  const index = Math.floor(Math.random() * info.count) + 1;
  const url = `/many/assets/img/oracle/moods/${info.prefix}-${index}.png`;

  oracleImg.classList.remove("morphing");
  void oracleImg.offsetWidth;
  oracleImg.classList.add("morphing");
  oracleImg.src = url;

  setTimeout(() => {
    oracleImg.classList.remove("morphing");
    void oracleImg.offsetWidth;
    oracleImg.classList.add("morphing");

    const idleInfo = moodVariants.idle;
    const idleIndex = Math.floor(Math.random() * idleInfo.count) + 1;
    oracleImg.src = `/many/assets/img/oracle/moods/${idleInfo.prefix}-${idleIndex}.png`;

    moodGlow.className = "";

    setTimeout(() => oracleImg.classList.remove("morphing"), 600);
  }, 6000);
}

// === Function: Add Floating Unown Runes ===
function summonRunes() {
  const container = document.getElementById("oracle-room");
  const shinyChance = 1 / 100;

  for (let i = 0; i < 15; i++) {
    const rune = document.createElement("div");
    rune.className = "floating-rune";
    rune.style.top = `${Math.random() * 100}%`;
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

// === Function: Animate Floating Rune Canvas Background ===
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

// === Show / Hide Suggestions Panel ===
function showOracleExtra(header, body, footer) {
  const extraPanel = document.getElementById("oracle-extra");
  const oracleLeft = document.querySelector(".oracle-left");

  // Ensure target nodes exist
  const headerEl = document.getElementById("extra-header");
  const bodyEl   = document.getElementById("extra-body");
  const footerEl = document.getElementById("extra-footer");

  if (!extraPanel || !oracleLeft || !headerEl || !bodyEl || !footerEl) {
    console.warn("❌ Oracle Extra panel or content containers not found!");
    return;
  }

  // Debug output
  console.group("🔍 showOracleExtra()");
  console.log("Header:", header);
  console.log("Body HTML:", body);
  console.log("Footer:", footer);
  console.groupEnd();

  // Set content
  headerEl.textContent = header || '';
  bodyEl.innerHTML     = body || '<div style="color: red;">⚠️ No body content</div>';
  footerEl.innerHTML   = footer || '';

  // Show the extra panel with animation classes
  oracleLeft.classList.add("slide-left");
  extraPanel.classList.remove("hidden");
  wrapper.classList.add("extra-visible");

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
    wrapper.classList.remove("extra-visible");
  }, 500);
}

// === Initialization: Set Up Oracle Behavior ===
document.addEventListener("DOMContentLoaded", () => {
  summonRunes();
  initRuneCanvas();
  maybeMakeDittoShiny();
  loadOracleData();
  wrapper.classList.remove("extra-visible");
});

// === Suggestion Button Clicks ===
document.addEventListener("click", e => {
  const btn = e.target.closest(".suggestion-button");
  if (btn?.dataset?.id) {
    const id = btn.dataset.id;
    const entry = oracleData.find(e => e.id === id);
    if (entry) {
      // Store selected entry for direct display
      lastOracleEntry = entry;

      // Show user message with the suggestion label for UX
      const label = (entry.original || entry.keywords?.join(" ") || "Ask");

      userInput.value = label;
      setTimeout(() => chatForm.requestSubmit(), 10);
    }
  }
});

// === Chat Submission ===
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

  // If lastOracleEntry is set (from suggestion click), use it directly
  if (lastOracleEntry) {
    const reply = lastOracleEntry.response;
    const mood = lastOracleEntry.mood || "idle";
    const extra = lastOracleEntry.extra || null;

    setMood(mood);
    changeExpression(mood);

    setTimeout(() => {
      typeMessage(reply);
      if (extra) {
        showOracleExtra(extra.header, extra.body, extra.footer);
      } else {
        hideExtraPanel();
      }
    }, 200);

    // Reset so next input uses fuzzy matching again
    lastOracleEntry = null;
    return;
  }

  // Normal fuzzy matching if no lastOracleEntry
  const { text: reply, mood, extra } = generateOracleResponse(text);
  setMood(mood);
  changeExpression(mood);

  setTimeout(() => {
    typeMessage(reply);
    if (extra) {
      showOracleExtra(extra.header, extra.body, extra.footer);
    } else {
      hideExtraPanel();
    }
  }, 200);
});
