# Team Shiny Living Dex

<section class="shiny-dex">

  <div class="counter-toggle-wrapper" style="display:flex; align-items:center; justify-content:flex-end; gap:1rem; margin:1rem 0;">
    <div id="shiny-counter" class="shiny-counter">
      <span class="count-owned">0</span> / <span class="count-total">630</span>
    </div>
    <!-- The toggle buttons will be inserted here dynamically -->
  </div>

  <div class="shinydex-grid" id="shiny-grid"></div>

  <!-- Modal... (unchanged) -->
  <div id="modal" class="modal hidden">
    <div class="modal-content">
      <span class="modal-close">&times;</span>
      <h2 id="modal-name"></h2>
      <img id="modal-img" />
      <ul id="modal-owners"></ul>
    </div>
  </div>

</section>

<link rel="stylesheet" href="/many/assets/css/showcase/living-dex.css">
<script defer src="/many/assets/js/showcase/living-dex.js"></script>