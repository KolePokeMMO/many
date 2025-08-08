# Shiny Showcase

<div id="shiny-controls" class="shiny-controls">
  <div class="filter-group">
    <input class="search" type="search" name="search" placeholder="⌕ Search Pokémon, trainer, location..." />
    <select name="region">
      <option value="">All Regions</option>
      <option value="Kanto">Kanto</option>
      <option value="Johto">Johto</option>
      <option value="Hoenn">Hoenn</option>
      <option value="Sinnoh">Sinnoh</option>
      <option value="Unova">Unova</option>
    </select>
    <select name="shiny_type">
      <option value="">All Shiny Types</option>
      <option value="Shiny">Shiny</option>
      <option value="Secret Shiny">Secret Shiny</option>
    </select>
    <select name="encounter">
      <option value="">All Encounters</option>
      <option value="Single">Single</option>
      <option value="Horde">Horde</option>
      <option value="Egg">Egg</option>
      <option value="Safari">Safari</option>
      <option value="Gift">Gift</option>
    </select>
    <label>
      <input type="checkbox" name="alpha" value="true" />
      Alpha Only
    </label>
  </div>
</div>


<div id="pagination" class="pagination"></div>
<div id="shiny-grid" class="shiny-grid"></div>

<link rel="stylesheet" href="/many/assets/css/showcase/showcase.css">
<script defer src="/many/assets/js/showcase/shinies.js"></script>