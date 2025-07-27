const grid = document.getElementById("shiny-grid");
const shinyDexSection = document.querySelector(".shiny-dex");
const modal = document.getElementById("modal");
const modalName = document.getElementById("modal-name");
const modalImg = document.getElementById("modal-img");
const modalOwners = document.getElementById("modal-owners");
const modalClose = document.querySelector(".modal-close");

// Create and insert toggle buttons
const toggleContainer = document.createElement("div");
toggleContainer.className = "view-toggle";
toggleContainer.innerHTML = `
  <button class="view-btn active" data-view="grid">🔳 Grid</button>
  <button class="view-btn" data-view="list">📋 List</button>
`;
const counterToggleWrapper = document.querySelector(".counter-toggle-wrapper");
counterToggleWrapper.appendChild(toggleContainer);


const list = document.createElement("div");
list.id = "shiny-list";
list.className = "shinydex-list";
list.style.display = "none"; // Hide initially
shinyDexSection.insertBefore(list, grid.nextSibling);

let shinyData = [];

function createGrid(data) {
  grid.innerHTML = "";
  data.forEach(p => {
    const cell = document.createElement("div");
    cell.className = "shiny-cell";

    if (p.trainers && p.trainers.length) {
      cell.classList.add("owned");
    }

    const img = document.createElement("img");
    img.src = `https://img.pokemondb.net/sprites/home/shiny/${p.name.toLowerCase()}.png`;
    img.alt = p.name;
    cell.appendChild(img);

    cell.addEventListener("click", () => openModal(p, img.src));

    grid.appendChild(cell);
  });
}

function createList(data) {
  list.innerHTML = "";

  const table = document.createElement("table");
  table.className = "shiny-table";

  table.innerHTML = `
    <thead>
      <tr>
        <th>Pokémon</th>
        <th>Dex #</th>
        <th>Owners</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement("tbody");

  data.forEach(p => {
    const tr = document.createElement("tr");
    tr.className = p.trainers && p.trainers.length ? "owned" : "";

    tr.innerHTML = `
      <td><img src="https://img.pokemondb.net/sprites/home/shiny/${p.name.toLowerCase()}.png" alt="${p.name}" class="list-img" /> ${p.name}</td>
      <td>${p.dex}</td>
      <td>${p.trainers.length ? p.trainers.map(t => `${t.name} (${t.date})`).join(", ") : "None"}</td>
    `;

    tr.addEventListener("click", () => openModal(p, tr.querySelector("img").src));

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  list.appendChild(table);
}

function openModal(pokemon, imgSrc) {
  modalName.textContent = `#${pokemon.dex} - ${pokemon.name}`;
  modalImg.src = imgSrc;
  modalOwners.innerHTML = pokemon.trainers.length
    ? pokemon.trainers.map(t => `<li>${t.name} — ${t.date}</li>`).join("")
    : "<li>No shiny found yet</li>";
  modal.classList.remove("hidden");
}

fetch("/many/assets/data/living-dex.json")
  .then(response => response.json())
  .then(data => {
    shinyData = data;

    // Count owned
    const ownedCount = data.reduce((acc, p) => (p.trainers && p.trainers.length ? acc + 1 : acc), 0);

    document.querySelector(".count-owned").textContent = ownedCount;
    document.querySelector(".count-total").textContent = data.length;

    createGrid(data);
  });

// View toggle logic
document.querySelectorAll(".view-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    if (btn.dataset.view === "grid") {
      grid.style.display = "grid";
      list.style.display = "none";
      createGrid(shinyData);
    } else {
      grid.style.display = "none";
      list.style.display = "block";
      createList(shinyData);
    }
  });
});

// Modal close events
modalClose.addEventListener("click", () => modal.classList.add("hidden"));
window.addEventListener("keydown", e => {
  if (e.key === "Escape") modal.classList.add("hidden");
});
modal.addEventListener("click", e => {
  if (!document.querySelector(".modal-content").contains(e.target)) {
    modal.classList.add("hidden");
  }
});
