# Pheno Tracker

> ### What are Phenomenon Pokémon?
>
> Phenomenon Pokémon — or “Phenos” — are rare, special encounters that happen in shaking grass, swirling dust clouds, rippling water, or bridge shadows.
> They're often the hardest Pokémon to find in PokeMMO, and are usually the last ones players need to complete their regional or national dex.
>
> This page helps you learn where to find each Pheno, what triggers their appearance, and allows you to track your progress by checking off the ones you’ve caught. Your progress is saved locally in your browser.

---

<details class="pheno-mechanics-guide">
  <summary>How Phenomenon Pokémon Work - [Open]</summary>

  <h3>Mechanics</h3>

  <ul class="pheno-info">
    <li>Each Pokémon found via phenomena has a <strong>30% chance</strong>to have <strong>one IV at 30 or above</strong>.</li>
    <li>There are always <strong>at least 2 phenomena</strong>active across Unova at any given time.</li>
    <li>Phenomena last roughly <strong>15–20 minutes</strong>before vanishing.</li>
    <li>They <strong>do not appear in swarm reports</strong>or through televisions like other special encounters.</li>
  </ul>

  <hr />

  <h3>Types of Phenomena</h3>

  <table class="pheno-table">
    <thead>
      <tr>
        <th>Icon</th><th>Type</th><th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><img src="https://static.wikia.nocookie.net/pokemmo/images/a/ae/Enc_Rustling_Grass.png" style="width: 20px;" /></td>
        <td><strong>Rustling Grass</strong></td>
        <td>Found in grassy areas. Often contain rare wild Pokémon.</td>
      </tr>
      <tr>
        <td><img src="https://static.wikia.nocookie.net/pokemmo/images/e/e3/Enc_Rippling_Water.png" style="width: 20px;" /></td>
        <td><strong>Dust Cloud</strong></td>
        <td>Common in caves, may contain Drilbur or items.</td>
      </tr>
      <tr>
        <td><img src="https://static.wikia.nocookie.net/pokemmo/images/0/05/Enc_Dust_Cloud.png" style="width: 20px;" /></td>
        <td><strong>Rippling Water</strong></td>
        <td>Appears on fishing or surfing spots.</td>
      </tr>
      <tr>
        <td><img src="https://static.wikia.nocookie.net/pokemmo/images/2/26/Enc_Shadow.png" style="width: 20px;" /></td>
        <td><strong>Shadow</strong></td>
        <td>Flying Pokémon shadows on bridges.</td>
      </tr>
    </tbody>
  </table>

  <hr />

  <h3>Audio & Visual Cues</h3>

  <ul class="pheno-info">
    <li><strong>Sound intensity</strong>increases as you get closer to the phenomenon.</li>
    <li>Sounds <strong>never stop</strong>until the phenomenon expires—so follow your ears!</li>
    <li>The <strong>visual effect</strong>helps identify the type and location.</li>
  </ul>
</details>


---

<div class="pheno-toolbar">
<label class="custom-checkbox">
  <input type="checkbox" id="filter-missing">
  <span class="checkmark"></span>
  Show only missing
</label>
  
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

<link rel="stylesheet" href="/many/assets/css/utilities/pheno-tracker.css">
<script defer src="/many/assets/js/utilities/st/pheno-tracker.js"></script>