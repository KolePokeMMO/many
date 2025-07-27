# Pheno Tracker

Use this tool to track your Phenomenon Pokémon progress in PokeMMO. Check off which Pokémon you've caught to help complete your collection!

<label><input type="checkbox" id="filter-missing" /> Show only missing</label>

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

