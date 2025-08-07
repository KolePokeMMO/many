---
title: Project PRNG
hide:
  - toc
---

<div class="prng-header">
  <h1>Project PRNG</h1>
  <p>A Shiny Legion experiment to test character-based RNG in PokeMMO. Upload your Archetype data, track your characters, and help uncover the truth.</p>
</div>

<div id="prng-upload-section">
  <h2>📂 Upload Archetype Encounter File</h2>
  <input type="file" id="encounterFile" accept=".txt" />
  <form id="characterForm" style="display:none">
    <input type="text" id="playerName" placeholder="Your name" required />
    <input type="text" id="charName" placeholder="Character name" required />
    <select id="region" required>
      <option value="">Select region</option>
      <option value="Kanto">Kanto</option>
      <option value="Johto">Johto</option>
      <option value="Hoenn">Hoenn</option>
      <option value="Sinnoh">Sinnoh</option>
      <option value="Unova">Unova</option>
    </select>
    <textarea id="notes" placeholder="Optional notes..."></textarea>
    <label>
      <input type="checkbox" id="completedRun" />
      Mark as completed (Reached E4)
    </label>
    <input
      type="number"
      id="hoursPlayed"
      placeholder="Hours played (from Trainer Card)"
      style="display:none"
      min="0"
      step="0.1"
    />
    <button type="submit">Submit Character</button>
  </form>
  <div id="uploadSuccess" style="display:none">
    <p>Character data padded. Download the JSON code and share it with Kole or Kelly on discord.</p>
    <a id="downloadJson" href="#" download style="display:inline-block; cursor:pointer; user-select:none;">💾 Download JSON</a>
  </div>
</div>

<hr />

<div id="prng-controls">
  <h2>Filter + Sort</h2>
  <input type="text" id="searchInput" placeholder="Search player or character" />
  <select id="statusFilter">
    <option value="">All statuses</option>
    <option value="Active">Active</option>
    <option value="Completed">Completed</option>
  </select>
  <select id="regionFilter">
    <option value="">All regions</option>
    <option value="Kanto">Kanto</option>
    <option value="Johto">Johto</option>
    <option value="Hoenn">Hoenn</option>
    <option value="Sinnoh">Sinnoh</option>
    <option value="Unova">Unova</option>
  </select>
  <select id="shinyFilter">
    <option value="">All</option>
    <option value="Yes">Found shiny</option>
    <option value="No">No shiny</option>
  </select>
  
  <button id="clearFilters" type="button">Clear Filters</button>

</div>

<button id="solo-toggle">View Recommended Solo Pokémon</button>

<div id="solo-slideout" class="solo-panel">

<div class="solo-pokemon">
  <img src="https://play.pokemonshowdown.com/sprites/ani/starmie.gif" alt="Starmie">
  <h3>Starmie</h3>
  <p><strong>Type:</strong> Water / Psychic<br>
     <strong>Base Stats:</strong> 115 Spe / 100 SpA / 85 SpD<br>
     <strong>IVs:</strong> 25+ SpA/Spe <br>
     <strong>Abilities:</strong> Natural Cure (ideal)<br>
     <strong>Ideal Nature:</strong> Modest / Timid<br>
     <strong>Moves:</strong> Surf / Psychic / Thunderbolt / Ice Beam<br>
     <strong>Pros:</strong> Extremely fast, diverse coverage, handles most gyms solo.
  </p>
</div>

<div class="solo-pokemon">
  <img src="https://play.pokemonshowdown.com/sprites/ani/snorlax.gif" alt="Snorlax">
  <h3>Snorlax</h3>
  <p><strong>Type:</strong> Normal<br>
     <strong>Base Stats:</strong> 160 HP / 110 Atk / 110 SpD<br>
     <strong>IVs:</strong> 25+ Atk/Spe <br>
     <strong>Abilities:</strong> Thick Fat<br>
     <strong>Ideal Nature:</strong> Adamant / Careful<br>
     <strong>Moves:</strong> Body Slam / Crunch / Rest / Sleep Talk<br>
     <strong>Pros:</strong> Incredible bulk, solo tanks E4 with setup.
  </p>
</div>

<div class="solo-pokemon">
  <img src="https://play.pokemonshowdown.com/sprites/ani/gengar.gif" alt="Gengar">
  <h3>Gengar</h3>
  <p><strong>Type:</strong> Ghost / Poison<br>
     <strong>Base Stats:</strong> 110 SpA / 110 Spe<br>
     <strong>IVs:</strong> 25+ SpA/Spe <br>
     <strong>Abilities:</strong> Levitate <br>
     <strong>Ideal Nature:</strong> Timid<br>
     <strong>Moves:</strong> Shadow Ball / Thunderbolt / Giga Drain / Substitute<br>
     <strong>Pros:</strong> Sweeps Erika, Sabrina, Agatha; immune to many threats.
  </p>
</div>

<div class="solo-pokemon">
  <img src="https://play.pokemonshowdown.com/sprites/ani/gyarados.gif" alt="Gyarados">
  <h3>Gyarados</h3>
  <p><strong>Type:</strong> Water / Flying<br>
     <strong>Base Stats:</strong> 125 Atk / 100 Spe / 95 HP<br>
     <strong>IVs:</strong> 25+ Atk/Spe <br>
     <strong>Abilities:</strong> Intimidate<br>
     <strong>Ideal Nature:</strong> Adamant<br>
     <strong>Moves:</strong> Waterfall / Crunch / Dragon Dance / Ice Fang<br>
     <strong>Pros:</strong> DD sweeper, smashes Koga, Blaine, Bruno.
  </p>
</div>

<div class="solo-pokemon">
  <img src="https://play.pokemonshowdown.com/sprites/ani/alakazam.gif" alt="Alakazam">
  <h3>Alakazam</h3>
  <p><strong>Type:</strong> Psychic<br>
     <strong>Base Stats:</strong> 135 SpA / 120 Spe<br>
     <strong>IVs:</strong> 25+ SpA/Spe <br>
     <strong>Abilities:</strong> Synchronize<br>
     <strong>Ideal Nature:</strong> Timid<br>
     <strong>Moves:</strong> Psychic / Shadow Ball / Calm Mind / Recover<br>
     <strong>Pros:</strong> Deletes anything that doesn't resist it.
  </p>
</div>

</div>

<div id="prng-grid"></div>

<script src="/many/assets/js/utilities/prng/prng.js"></script>
<link rel="stylesheet" href="/many/assets/css/utilities/prng.css" />

<script>
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("solo-toggle");
  const panel = document.getElementById("solo-slideout");

  toggle.addEventListener("click", () => {
    panel.classList.toggle("visible");
    toggle.textContent = panel.classList.contains("visible")
      ? "Hide Recommended Solo Pokémon"
      : "View Recommended Solo Pokémon";
  });
});
</script>