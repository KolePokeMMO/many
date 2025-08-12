---
title: Project PRNG
hide:
  - toc
---

<div class="box prng-header">
  <h1>Project PRNG</h1>
  <p>A Shiny Legion experiment to test character-based RNG in PokeMMO. Upload your Archetype data, track your characters, and help uncover the truth.</p>
</div>

<div id="prng-top-row">
  <!-- Upload Section -->
  <div class="box" id="prng-upload-section">
    <h2>📂 Upload Archetype Encounter File</h2>
    <input type="file" id="encounterFile" accept=".txt" />
    <p class="file-location-note">
      Location: C:\Program Files\PokeMMO\data\mods\archetype-counter-main\src\stored\<span id="profile-name-placeholder">Profile Name</span>
    </p>
    <p class="file-location-note">
      Make sure you start a new profile or <strong>clear encounters</strong> each time you make a new character, then choose that profile to upload here.
    </p>
    <form id="characterForm">
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
        min="0"
        step="0.1"
      />
      <button type="submit">Submit Character</button>
    </form>
    <div id="uploadSuccess">
      <p>Character data padded. Download the JSON code and share it with Kole or Kelly on Discord.</p>
      <a id="downloadJson" href="#" download>💾 Download JSON</a>
    </div>
  </div>

  <!-- Directions Box -->
  <div class="box" id="prng-directions">
    <h3>Directions</h3>
    <ul>
      <li>Upload the <strong>.txt</strong> file from the Archetype tool.</li>
      <li>Fill in your player and character name.</li>
      <li>Select the region your character started in.</li>
      <li>If you reached the Elite Four, tick the "completed" checkbox to reveal the hours field.</li>
      <li>Click Submit to convert your file into JSON automatically.</li>
      <li>Download and share it with Kole via <strong>Discord</strong>.</li><br>
      <li>You can update progress on a character by doing the same steps.</li>
      <li>Repeat for each character, using a different name, to show multiple cards below.</li>
    </ul>
  </div>

  <!-- Solo Button + Play Guide Column -->
  <div class="column">
    <!-- Solo / Supplies Button Column -->
    <div class="box" id="prng-solo-button-wrapper">
      <button id="solo-toggle">Recommended Sweepers</button>
      <button id="supplies-toggle">Recommended Supplies</button>
    </div>
    <div class="box" id="play-guide">
      <h3>Play Guide</h3>
      <ul>
        <li>Create a new character in the region that feels easiest for <strong>you</strong>.</li>
        <li>Use the button above to pick a powerful sweeper, or build your own team.</li>
        <li>Mail yourself supplies like money, Poké Balls, and other essentials.</li>
        <li>Play through the story until you reach the Elite Four.</li>
        <li>Speed through and encounter as many wild Pokémon as possible along the way—even sweet scent if you can.</li>
        <li>If you don’t find any shinies, mail supplies back, delete your character, and try again.</li>
      </ul>
    </div>
  </div>
</div>

<hr />

<div class="box" id="prng-controls">
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

<div id="solo-slideout" class="slideout">
<button class="close-btn" aria-label="Close panel">Close</button>
  <span class="solo-span">Feel free to offer edits/suggestions, these are just to get us started.</span> <br><br>
  <div class="solo-pokemon">
    <img src="https://play.pokemonshowdown.com/sprites/ani/starmie.gif" alt="Starmie">
    <h3>Starmie</h3>
    <p><strong>Type:</strong> Water / Psychic<br>
      <strong>Base Stats:</strong> 115 Spe / 100 SpA / 85 SpD<br>
      <strong>IVs:</strong> 25+ SpA/Spe <br>
      <strong>Abilities:</strong> Natural Cure (ideal)<br>
      <strong>Ideal Nature:</strong> Modest / Timid<br>
      <strong>Moves:</strong> Surf / Psychic / Thunderbolt / Ice Beam<br>
      <strong>Pros:</strong> Extremely fast, diverse coverage, handles most gyms solo.<br>
      <strong>Cons:</strong> None.<br>
      <strong>Strong In:</strong> All
    </p>
  </div>

  <div class="solo-pokemon">
    <img src="https://play.pokemonshowdown.com/sprites/ani/porygon-z.gif" alt="Porygon-Z">
    <h3>Porygon-Z</h3>
    <p><strong>Type:</strong> Normal<br>
      <strong>Base Stats:</strong> 85 HP / 135 SpA / 90 Spe<br>
      <strong>IVs:</strong> 25+ SpA/Spe <br>
      <strong>Abilities:</strong> Adaptability<br>
      <strong>Ideal Nature:</strong> Modest<br>
      <strong>Moves:</strong> Tri Attack / Thunderbolt / Shadowball / Nasty Plot or Signal Beam<br>
      <strong>Pros:</strong> Diverse coverage, fast evolution via items, only one weakness.<br>
      <strong>Cons:</strong> Hard to obtain, no wild locations.<br>
      <strong>Strong In:</strong> All
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
      <strong>Moves:</strong> Shadow Ball / Thunderbolt / Giga Drain / Substitute|??<br>
      <strong>Pros:</strong> Fast, Sweeps Erika, Sabrina, Agatha. Huge movepool<br>
      <strong>Cons:</strong> 4 weaknesses (Psychic/Ground/Ghost/Dark), has to trade evo.<br>
      <strong>Strong In:</strong> Kanto / Hoenn
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
      <strong>Pros:</strong> DD sweeper, smashes Koga, Blaine, Bruno.<br>
      <strong>Cons:</strong> <br>
      <strong>Strong In:</strong> 
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
      <strong>Pros:</strong> Deletes anything that doesn't resist it.<br>
      <strong>Cons:</strong> <br>
      <strong>Strong In:</strong> 
    </p>
  </div>

</div>

<!-- Supplies Slideout Panel -->
<div id="supplies-slideout" class="slideout">
<button class="close-btn" aria-label="Close panel">Close</button>
  <h3>Recommended Supplies</h3>
  <ul>
    <li>Poké Balls</li>
    <li>Potions</li>
    <li>Repels</li>
    <li>Antidotes</li>
    <li>Revives</li>
  </ul>
</div>

<div id="prng-grid"></div>

<script src="/many/assets/js/utilities/prng/prng.js"></script>
<link rel="stylesheet" href="/many/assets/css/utilities/prng.css" />

