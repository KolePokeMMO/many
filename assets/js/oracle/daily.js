// daily-oracle.js

const cookieImg = document.getElementById("cookie-img");
const fortuneSlip = document.getElementById("fortune-slip");
const huntspirationText = document.getElementById("huntspiration-text");
const mysticEchoText = document.getElementById("mystic-echo-text");

let cracked = false;

const sparkleOverlay = document.createElement("div");
sparkleOverlay.className = "sparkle-overlay";
document.querySelector(".fortune-cookie-col").appendChild(sparkleOverlay);

// Fetch all data files
Promise.all([
  fetch("/many/assets/data/oracle/daily/fortunes.json").then(r => r.json()),
  fetch("/many/assets/data/oracle/daily/huntspiration.json").then(r => r.json()),
  fetch("/many/assets/data/oracle/daily/mystic-echo.json").then(r => r.json())
]).then(([fortuneData, huntData, echoData]) => {
  // Extract .message strings from object arrays
  const fortunes = fortuneData.map(f => f.message);
  const huntspirations = huntData.map(h => h.message);
  const echoes = echoData.map(e => e.message);

  // Pick consistent daily fortune based on date hash
  const today = new Date().toISOString().split("T")[0];
  const seed = today.split("-").join(""); // YYYYMMDD
  const index = parseInt(seed) % fortunes.length;
  const fortune = fortunes[index];

  // Random huntspiration and mystic tip
  const hunt = huntspirations[Math.floor(Math.random() * huntspirations.length)];
  const echo = echoes[Math.floor(Math.random() * echoes.length)];

  huntspirationText.textContent = hunt;
  mysticEchoText.textContent = echo;

  // Fortune cookie interaction
cookieImg.addEventListener("click", () => {
  if (cracked) return;
  cracked = true;

  const container = document.querySelector(".fortune-cookie-col");
  container.classList.add("shake-earthquake");

  // Wait until the earthquake animation finishes
  container.addEventListener(
    "animationend",
    () => {
      container.classList.remove("shake-earthquake");

      // Now break the cookie
      cookieImg.src = "/many/assets/img/oracle/fortune/fortune-cookie-open.png";

        // Puff effect
        const dust = document.getElementById("cookie-dust");
        dust.classList.remove("hidden");
        dust.classList.add("puff");

        // Reset after animation
        dust.addEventListener("animationend", () => {
        dust.classList.remove("puff");
        dust.classList.add("hidden");
        }, { once: true });


      // Show slip
      fortuneSlip.textContent = fortune;
      fortuneSlip.classList.remove("hidden");

      // Sparkles
      for (let i = 0; i < 40; i++) spawnSparkle();
    },
    { once: true }
  );
});

}).catch(error => {
  console.error("Error loading daily oracle data:", error);
  huntspirationText.textContent = "⚠ Could not load huntspiration.";
  mysticEchoText.textContent = "⚠ Could not load mystic echo.";
  fortuneSlip.textContent = "⚠ Could not load your fortune.";
});

// Sparkle effect
function spawnSparkle() {
  const sparkle = document.createElement("div");
  sparkle.className = "sparkle";
  sparkle.style.position = "absolute";
  sparkle.style.left = Math.random() * 100 + "%";
  sparkle.style.top = Math.random() * 100 + "%";
  sparkle.style.width = "3px";
  sparkle.style.height = "3px";
  sparkle.style.borderRadius = "50%";
  sparkle.style.background = "#c9a16eff";
  sparkle.style.opacity = 0.7;
  sparkle.style.boxShadow = "0 0 8px #64461eff";
  sparkle.style.animation = `fadeout ${2 + Math.random() * 2}s forwards`;

  sparkleOverlay.appendChild(sparkle);

  setTimeout(() => sparkle.remove(), 4000);
}

// Sparkle animation
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeout {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.5); opacity: 1; }
    100% { transform: scale(0.5); opacity: 0; }
  }
`;
document.head.appendChild(style);

const countdownEl = document.getElementById("fortune-countdown");

function updateCountdown() {
  const now = new Date();

  // Calculate next midnight (24:00) in local time
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);

  const diff = nextMidnight - now;

  if (diff <= 0) {
    countdownEl.textContent = "New fortune incoming soon...";
    return;
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  countdownEl.textContent = `Next fortune in: ${hours}h ${minutes}m ${seconds}s`;
}

// Run once immediately, then update every second
updateCountdown();
setInterval(updateCountdown, 1000);

const shinyPokemonImg = document.getElementById("shiny-pokemon");

// Load living dex and pick random shiny Pokémon dynamically
fetch("/many/assets/data/living-dex.json")
  .then(res => res.json())
  .then(livingDex => {
    const shinyPokemonImg = document.getElementById("shiny-pokemon");
    const shinyLabel = document.getElementById("shiny-label");

    function showRandomShiny() {
      const randomEntry = livingDex[Math.floor(Math.random() * livingDex.length)];
      const rawName = randomEntry.name;
      const dexNumber = randomEntry.dex;

      // Format for URL (lowercase, remove special characters)
      const formattedName = rawName.toLowerCase().replace(/[^a-z0-9]/gi, '');

      // Image and label updates
      shinyPokemonImg.src = `https://play.pokemonshowdown.com/sprites/ani-shiny/${formattedName}.gif`;
      shinyPokemonImg.alt = `Shiny ${rawName}`;
      shinyPokemonImg.dataset.name = rawName;
      shinyPokemonImg.dataset.dex = dexNumber;

      shinyLabel.textContent = `#${dexNumber} ${rawName}`;
    }

    // On hover, show "Alpha" prefix
    shinyPokemonImg.addEventListener("mouseenter", () => {
      const name = shinyPokemonImg.dataset.name;
      const dex = shinyPokemonImg.dataset.dex;
      shinyLabel.textContent = `#${dex} Alpha ${name}`;
    });

    shinyPokemonImg.addEventListener("mouseleave", () => {
      const name = shinyPokemonImg.dataset.name;
      const dex = shinyPokemonImg.dataset.dex;
      shinyLabel.textContent = `#${dex} ${name}`;
    });

    // Initial load + click to refresh
    showRandomShiny();
    shinyPokemonImg.addEventListener("click", showRandomShiny);
  })
  .catch(err => {
    console.error("Failed to load living dex JSON:", err);
    // Optional: fallback logic here
  });
