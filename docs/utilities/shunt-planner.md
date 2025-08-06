---
title: Shunt Planner
---

# 🗺️ Shiny Hunt Route Planner

<div class="shunt-container">

  <div class="shunt-filters">
    <label for="region-select">Region</label>
    <select id="region-select">
      <option value="any">Any Region</option>
      <option value="kanto">Kanto</option>
      <option value="johto">Johto</option>
      <option value="hoenn">Hoenn</option>
      <option value="sinnoh">Sinnoh</option>
      <option value="unova">Unova</option>
    </select>

    <label for="target-select">Target Pokémon</label>
    <select id="target-select">
      <option value="">-- Choose a target --</option>
    </select>

    <label for="method-select">Hunt Method</label>
    <select id="method-select">
      <option value="any">Any</option>
      <option value="sweet-scent">Sweet Scent</option>
      <option value="repel-trick">Repel Trick</option>
      <option value="alpha">Alpha Swarms</option>
    </select>
  </div>

  <div class="shunt-results" id="results">
    <!-- Filtered data will appear here -->
  </div>

  <div class="shunt-controls">
    <div id="pinned-target">None selected</div>

    <!-- Added inputs for tracking encounters & caught status of pinned target -->
    <div class="encounter-box">
      <label>Current Encounters:
        <input type="number" id="pinned-encounter" min="0" />
      </label>
      <label class="caught-checkbox">
        <span>Caught</span>
        <input type="checkbox" id="pinned-caught" />
      </label>
    </div>

    <div class="shunt-sprites">
      <h4>✨ Sprites</h4>
      <div class="sprite-pair">
        <div>
          <div class="sprite-label">Normal</div>
          <img id="sprite-normal" src="" alt="Normal Sprite" />
        </div>
        <div>
          <div class="sprite-label">Shiny</div>
          <img id="sprite-shiny" src="" alt="Shiny Sprite" />
        </div>
      </div>
    </div>

    <h4>📝 Notes</h4>
    <textarea id="notes" rows="6" placeholder="Shunt Notes ..."></textarea>
<div class="notes-actions">
  <button id="save-notes-btn">Save Notes</button>
  <button id="clear-notes-btn">Clear Notes</button>
</div>
  </div>

</div>

<script src="/many/assets/js/utilities/sp/shunt-planner.js"></script>
<link rel="stylesheet" href="/many/assets/css/utilities/shunt-planner.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>


<script>
function syncColumnHeights() {
  const container = document.querySelector('.shunt-container');
  const filters = container.querySelector('.shunt-filters');
  const results = container.querySelector('.shunt-results');
  const controls = container.querySelector('.shunt-controls');

  // Reset heights
  filters.style.height = '';
  results.style.maxHeight = '';

  // Get height of the right column
  const targetHeight = controls.offsetHeight;

  // Sync heights
  filters.style.height = `${targetHeight}px`;
  results.style.maxHeight = `${targetHeight}px`;
}

window.addEventListener('load', syncColumnHeights);
window.addEventListener('resize', syncColumnHeights);
</script>

