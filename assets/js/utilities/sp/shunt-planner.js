// shunt-planner.js

// Load planner data
async function loadPlannerData() {
  const res = await fetch("/many/assets/data/shunt-planner.json");
  return res.json();
}

// Populate Pokémon dropdown
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

// Filter logic
function filterData(data, target, region, method) {
  return data.filter(entry => {
    const targetMatch = !target || entry.pokemon === target;
    const regionMatch = region === "any" || entry.region.toLowerCase() === region;
    const methodMatch = method === "any" || entry.method === method;
    return targetMatch && regionMatch && methodMatch;
  });
}

// Render results
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

    block.innerHTML = `
      <h3>${entry.route} (${entry.region})</h3>
      <ul>
        <li><strong>Pokémon:</strong> ${entry.pokemon}</li>
        <li><strong>Method:</strong> ${entry.method}</li>
        <li><strong>Repel Level:</strong> ${entry.repel_level || "N/A"}</li>
        <li><strong>Sweet Scent:</strong> ${entry.sweet_scent ? "Yes" : "No"}</li>
        <li><strong>Alpha Available:</strong> ${entry.alpha ? "Yes" : "No"}</li>
        <li><strong>Tips:</strong> ${entry.notes || "None"}</li>
      </ul>
    `;

    container.appendChild(block);
  }
}

// Attach listeners
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
  update(); // Initial render
}

// Init on DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadPlannerData();
  populateTargetOptions(data);
  setupFilters(data);
});
