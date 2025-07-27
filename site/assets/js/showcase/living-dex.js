const grid = document.getElementById("shiny-grid");
const modal = document.getElementById("modal");
const modalName = document.getElementById("modal-name");
const modalImg = document.getElementById("modal-img");
const modalOwners = document.getElementById("modal-owners");
const modalClose = document.querySelector(".modal-close");

// Use fetch instead of static import
fetch("/many/assets/data/living-dex.json")
  .then(response => response.json())
  .then(data => {
    data.forEach(p => {
      const cell = document.createElement("div");
      cell.className = "shiny-cell";
      if (p.trainers && p.trainers.length) cell.classList.add("owned");

      const img = document.createElement("img");
      img.src = `https://img.pokemondb.net/sprites/home/normal/${p.name.toLowerCase()}.png`;
      img.alt = p.name;
      cell.appendChild(img);

      cell.addEventListener("click", () => {
        modalName.textContent = `#${p.dex} - ${p.name}`;
        modalImg.src = img.src;
        modalOwners.innerHTML = p.trainers.length
          ? p.trainers.map(t => `<li>${t.name} — ${t.date}</li>`).join("")
          : "<li>No shiny found yet</li>";
        modal.classList.remove("hidden");
      });

      grid.appendChild(cell);
    });
  });

// Modal close behavior
modalClose.addEventListener("click", () => modal.classList.add("hidden"));
window.addEventListener("keydown", e => {
  if (e.key === "Escape") modal.classList.add("hidden");
});
