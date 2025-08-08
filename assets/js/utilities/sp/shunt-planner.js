// shunt-planner.js

// Run planner initialization after full DOM content loaded
document.addEventListener("DOMContentLoaded", async () => {
  await initPlanner();
});

/**
 * Fetches planner data JSON file asynchronously.
 * Returns array of route objects.
 */
async function loadPlannerData() {
  try {
    const res = await fetch("/many/assets/data/shunt-planner.json");
    if (!res.ok) throw new Error("Network response not ok");
    return await res.json();
  } catch (err) {
    console.error("Failed to load planner data:", err);
    return [];
  }
}

/**
 * Capitalizes the first letter of each word in the string.
 * e.g. "sinnoh" -> "Sinnoh"
 */
function capitalize(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Converts strings like "sweet-scent" into "Sweet Scent".
 * Used for method and region formatting.
 */
function toTitleCase(str) {
  return str.replace(/(^|-)\w/g, m => m.toUpperCase()).replace(/-/g, ' ');
}

/**
 * Populates the target Pokémon <select> options from unique
 * Pokémon names found in the data.
 */
function populateTargetOptions(data) {
  const select = document.getElementById("target-select");
  const names = [...new Set(data.map(entry => entry.pokemon))].sort();
  for (const name of names) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  }
}

/**
 * Filters the full data list based on the selected target, region,
 * and method filters.
 */
function filterData(data, target, region, method) {
  return data.filter(entry => {
    const targetMatch = !target || entry.pokemon === target;
    const regionMatch = region === "any" || entry.region.toLowerCase() === region;
    const methodMatch = method === "any" || entry.method === method;
    return targetMatch && regionMatch && methodMatch;
  });
}

/**
 * Renders the filtered results inside #results container.
 * Also sets up event listeners to persist encounter counts and caught toggles.
 */
function renderResults(results) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  if (results.length === 0) {
    container.innerHTML = "<p class='shunt-empty'>No matching routes found. Try different filters.</p>";
    return;
  }

  for (const entry of results) {
    const block = document.createElement("div");
    block.className = "shunt-entry";

    // Format region and method strings nicely
    const formattedRegion = toTitleCase(entry.region);
    const formattedMethod = toTitleCase(entry.method);

    block.innerHTML = `
      <h3>${entry.route} (${formattedRegion})</h3>
      <ul>
        <li><strong>Pokémon:</strong> ${entry.pokemon}</li>
        <li><strong>Method:</strong> ${formattedMethod}</li>
        <li><strong>Repel Level:</strong> ${entry.repel_level || "N/A"}</li>
        <li><strong>Sweet Scent:</strong> ${entry.sweet_scent ? "Yes" : "No"}</li>
        <li><strong>Alpha Available:</strong> ${entry.alpha ? "Yes" : "No"}</li>
        <li><strong>Tips:</strong> ${entry.notes || "None"}</li>
      </ul>

      <div class="encounter-box">
        <label>Current Encounters:
          <span class="encounter-count" data-key="${entry.pokemon}">
            Loading...
          </span>
        </label>
      </div>
    `;

    container.appendChild(block);
  }

  // Restore saved encounter counts & caught toggles from localStorage
  document.querySelectorAll(".encounter-count").forEach(span => {
    const key = span.dataset.key;
    const saved = localStorage.getItem(`shuntEncounters-${key}`);
    span.textContent = saved ? Number(saved).toLocaleString() : "0";
  });


  document.querySelectorAll(".caught-toggle").forEach(box => {
    const key = box.dataset.key;
    const saved = localStorage.getItem(`shuntFound-${key}`);
    if (saved === "true") box.checked = true;

    box.addEventListener("change", () => {
      localStorage.setItem(`shuntFound-${key}`, box.checked);
    });
  });
}

/**
 * Sets up event listeners on filter selects (target, region, method)
 * to filter and render the results when changed.
 */
function setupFilters(data) {
  const target = document.getElementById("target-select");
  const region = document.getElementById("region-select");
  const method = document.getElementById("method-select");

  const update = () => {
    const filtered = filterData(data, target.value, region.value, method.value);
    renderResults(filtered);
  };

  target.addEventListener("change", update);
  region.addEventListener("change", update);
  method.addEventListener("change", update);

  // Initial render with no filters applied
  update();
}

/**
 * Loads encounter count and caught status for pinned target
 * from localStorage and updates UI inputs accordingly.
 */
function loadProgress(target) {
  const encounterInput = document.getElementById("pinned-encounter");
  const caughtToggle = document.getElementById("pinned-caught");

  if (!encounterInput || !caughtToggle) return;

  const savedEncounters = localStorage.getItem(`shuntEncounters-${target}`);
  const savedCaught = localStorage.getItem(`shuntFound-${target}`);

  encounterInput.value = savedEncounters || "";
  caughtToggle.checked = savedCaught === "true";
}

/**
 * Saves encounter count and caught status for pinned target to localStorage.
 */
function saveProgress(target) {
  const encounterInput = document.getElementById("pinned-encounter");
  const caughtToggle = document.getElementById("pinned-caught");

  if (!encounterInput || !caughtToggle) return;

  localStorage.setItem(`shuntEncounters-${target}`, encounterInput.value);
  localStorage.setItem(`shuntFound-${target}`, caughtToggle.checked);
}

/**
 * Main initializer function called after DOMContentLoaded.
 * Loads data, sets up filters and event listeners, loads saved
 * pinned target data and notes.
 */
async function initPlanner() {
  const data = await loadPlannerData();
  populateTargetOptions(data);
  setupFilters(data);

  // Cache DOM elements used multiple times
  const pinnedTargetEl = document.getElementById("pinned-target");
  const notesEl = document.getElementById("notes");
  const saveBtn = document.getElementById("save-notes-btn");
  const clearBtn = document.getElementById("clear-notes-btn");

  const targetSelect = document.getElementById("target-select");
  const normalImg = document.getElementById("sprite-normal");
  const shinyImg = document.getElementById("sprite-shiny");

  // These are the encounter count input and caught checkbox for the pinned target
  const encounterInput = document.getElementById("pinned-encounter");
  const foundToggle = document.getElementById("pinned-caught");

  // Load pinned target from localStorage, if any
  const pinnedTarget = localStorage.getItem("shuntPinnedTarget");
  if (pinnedTarget) {
    pinnedTargetEl.textContent = pinnedTarget;
    targetSelect.value = pinnedTarget;
    const formatted = pinnedTarget.toLowerCase().replace(/ /g, '-');
    normalImg.src = `https://projectpokemon.org/images/normal-sprite/${formatted}.gif`;
    shinyImg.src = `https://projectpokemon.org/images/shiny-sprite/${formatted}.gif`;
    normalImg.alt = `${pinnedTarget} Normal Sprite`;
    shinyImg.alt = `${pinnedTarget} Shiny Sprite`;
    loadProgress(pinnedTarget);
  }

  // Load saved notes from localStorage, if any
  if (pinnedTarget) {
    const savedNotes = localStorage.getItem(`shuntNotes-${pinnedTarget}`);
    notesEl.value = savedNotes || "";
  }

  // When user changes target, update pinned target & sprites & load progress
  targetSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    if (val && val !== "none") {
      pinnedTargetEl.textContent = val;
      localStorage.setItem("shuntPinnedTarget", val);
      const formatted = val.toLowerCase().replace(/ /g, '-');
      normalImg.src = `https://projectpokemon.org/images/normal-sprite/${formatted}.gif`;
      shinyImg.src = `https://projectpokemon.org/images/shiny-sprite/${formatted}.gif`;
      normalImg.alt = `${val} Normal Sprite`;
      shinyImg.alt = `${val} Shiny Sprite`;
      loadProgress(val);
    } else {
      pinnedTargetEl.textContent = "None selected";
      localStorage.removeItem("shuntPinnedTarget");
      normalImg.src = shinyImg.src = "";
      normalImg.alt = shinyImg.alt = "";

      if (encounterInput) encounterInput.value = "";
      if (foundToggle) foundToggle.checked = false;
    }

    const savedNotes = localStorage.getItem(`shuntNotes-${val}`);
    notesEl.value = savedNotes || "";

  });

  // Save notes and pinned target progress on button click
  saveBtn.addEventListener("click", () => {
    const target = targetSelect.value;
    if (target) saveProgress(target);
    localStorage.setItem(`shuntNotes-${target}`, notesEl.value); // Change notes to be pokemon specific instead of 1 global note
    alert("Notes & progress saved.");
  });

  // Clear notes and pinned target progress on button click
  clearBtn.addEventListener("click", () => {
    notesEl.value = "";
    if (encounterInput) encounterInput.value = "";
    if (foundToggle) foundToggle.checked = false;

    const target = targetSelect.value;
    if (target) {
      localStorage.removeItem(`shuntEncounters-${target}`);
      localStorage.removeItem(`shuntFound-${target}`);
    }
    localStorage.removeItem(`shuntNotes-${target}`);
  });
}

