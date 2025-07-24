---
title: Shunt Planner
hide:
  - toc
  - navigation
  - path
---

# 🗺️ Shiny Hunt Route Planner

Plan your next shiny hunt with precision! Select your target Pokémon and get region-specific hunting advice, sweet scent zones, repel trick spots, and more.

<div id="shunt-planner" class="shunt-container">
  <div class="shunt-form">
    <label for="target-select">🎯 Target Pokémon</label>
    <select id="target-select">
      <option value="">-- Choose a target --</option>
    </select>

    <label for="region-select">🌍 Region</label>
    <select id="region-select">
      <option value="any">Any Region</option>
      <option value="kanto">Kanto</option>
      <option value="johto">Johto</option>
      <option value="hoenn">Hoenn</option>
      <option value="sinnoh">Sinnoh</option>
      <option value="unova">Unova</option>
    </select>

    <label for="method-select">🔍 Hunt Method</label>
    <select id="method-select">
      <option value="any">Any</option>
      <option value="sweet-scent">Sweet Scent</option>
      <option value="repel-trick">Repel Trick</option>
      <option value="alpha">Alpha Swarms</option>
    </select>
  </div>

  <div id="results" class="shunt-results"></div>
</div>
