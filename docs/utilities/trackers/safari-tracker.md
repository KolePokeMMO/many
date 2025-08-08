# Safari Tracker

> ### What is the Johto Safari Zone?
>
> The Johto Safari Zone in PokeMMO rotates its Pokémon daily based on the current area theme. This tracker helps you view current spawns, track your catches, and understand the layout and schedule for Johto, Kanto, Hoenn, and Sinnoh Safari Zones.

---

<details class="safari-guide">
  <summary>How Johto Safari Rotations Work - [Open]</summary>

  <h3>Mechanics</h3>
  <ul class="safari-info">
    <li>The Johto Safari Zone has <strong>6 zones</strong> which can be customised using Baoba’s tasks.</li>
    <li>Each zone has rotating Pokémon that <strong>change daily at 00:00 UTC</strong>.</li>
    <li>This page includes a rotation timer and full list of Pokémon per zone.</li>
  </ul>

  <h3>Rotation Timer</h3>
  <div id="rotation-timer"><strong>Next rotation:</strong> calculating...</div>

  <hr />

  <h3>Zone Layout</h3>
  <table class="safari-table">
    <thead><tr><th>Zone</th><th>Current Theme</th><th>Key Pokémon</th></tr></thead>
    <tbody id="zone-table-body">
      <!-- JS will inject rows here -->
    </tbody>
  </table>
</details>

---

<div class="safari-toolbar">
  <label class="custom-checkbox">
    <input type="checkbox" id="filter-safari-missing" />
    <span class="checkmark"></span>
    Show only missing
  </label>
  <button id="reset-safari" class="safari-reset">Reset All</button>
</div>

<div class="safari-progress-wrap">
  <div id="safari-counter">0 / ? caught</div>
  <div class="safari-progress-bar">
    <div id="safari-progress-fill"></div>
  </div>
</div>

<div id="safari-grid" class="pheno-grid">
  <!-- Cards will be injected here -->
</div>

<template id="safari-card-template">
  <div class="pheno-card">
    <div class="pheno-header-row">
      <img class="pheno-sprite" />
      <h2 class="pheno-name"></h2>
      <input type="checkbox" class="caught-toggle" title="Caught?" />
    </div>
    <div class="pheno-types"></div>
    <div class="pheno-locations"></div>
    <div class="pheno-method"></div>
  </div>
</template>

---

## Other Safari Zones

<details>
  <summary><strong>Kanto Safari Zone</strong></summary>
  - Classic bait/rock system. Pokémon flee often.  
  - Notable: Chansey, Scyther, Tauros, Dratini
</details>

<details>
  <summary><strong>Hoenn Safari Zone</strong></summary>
  - Split into north/south and wet/dry terrain.  
  - Notable: Heracross, Pikachu, Wobbuffet
</details>

<details>
  <summary><strong>Sinnoh Great Marsh</strong></summary>
  - Daily binocular-based spawn shifts in 6 areas.  
  - Notable: Carnivine, Croagunk, Skorupi
</details>

<link rel="stylesheet" href="/many/assets/css/utilities/safari-tracker.css">
<script defer src="/many/assets/js/utilities/st/safari-tracker.js"></script>