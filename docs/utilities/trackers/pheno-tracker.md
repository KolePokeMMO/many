# Pheno Tracker

> ### What are Phenomenon Pokémon?
>
> Phenomenon Pokémon — or “Phenos” — are rare, special encounters that happen in shaking grass, swirling dust clouds, rippling water, or bridge shadows.
> They're often the hardest Pokémon to find in PokeMMO, and are usually the last ones players need to complete their regional or national dex.
>
> This page helps you learn where to find each Pheno, what triggers their appearance, and allows you to track your progress by checking off the ones you’ve caught. Your progress is saved locally in your browser.

<details class="pheno-mechanics-guide">
  <summary>How Phenomenon Pokémon Work - [Open]</summary>
  <ul>
    <li><strong>Triggers:</strong> Phenomenon Pokémon spawn in special encounter areas (like rustling grass, dust clouds, rippling water, or bridge shadows) after walking for some time.</li>
    <li><strong>Repels:</strong> Do not prevent Pheno encounters, so you can safely use the Repel Trick!</li>
    <li><strong>Sweet Scent:</strong> Does <em>not</em> trigger Phenomenon battles.</li>
    <li><strong>Bridge Shadows:</strong> Appear only on specific bridges and are usually rarer and harder to encounter.</li>
    <li><strong>Persistence:</strong> Phenomenon Pokémon only appear for a limited time before despawning.</li>
  </ul>
</details>

---

<div class="pheno-toolbar">
  <label><input type="checkbox" id="filter-missing" /> Show only missing</label>
  <button id="reset-pheno" class="pheno-reset">Reset All</button>
</div>

<div class="pheno-progress-wrap">
  <div id="pheno-counter">0 / 7 caught</div>
  <div class="pheno-progress-bar">
    <div id="pheno-progress-fill"></div>
  </div>
</div>

<div id="pheno-grid" class="pheno-grid">
  <!-- Cards will be injected here -->
</div>

<template id="pheno-card-template">
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
