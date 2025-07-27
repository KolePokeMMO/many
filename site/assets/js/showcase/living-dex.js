const grid = document.getElementById("shiny-grid");
const modal = document.getElementById("modal");
const modalName = document.getElementById("modal-name");
const modalImg = document.getElementById("modal-img");
const modalOwners = document.getElementById("modal-owners");
const modalClose = document.querySelector(".modal-close");

fetch("/many/assets/data/living-dex.json")
  .then(response => response.json())
  .then(data => {
    let ownedCount = 0;

    data.forEach(p => {
      const cell = document.createElement("div");
      cell.className = "shiny-cell";

      if (p.trainers && p.trainers.length) {
        cell.classList.add("owned");
        ownedCount++;
      }

      const img = document.createElement("img");
      img.src = `https://img.pokemondb.net/sprites/home/shiny/${p.name.toLowerCase()}.png`;
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

    // Update counter
    document.querySelector(".count-owned").textContent = ownedCount;
    document.querySelector(".count-total").textContent = data.length;
  });


// Close modal when clicking the "X"
document.querySelector('.modal-close').addEventListener('click', () => {
  document.getElementById('modal').classList.add('hidden');
});

// Close modal when clicking outside the modal-content
document.getElementById('modal').addEventListener('click', (e) => {
  const modalContent = document.querySelector('.modal-content');
  if (!modalContent.contains(e.target)) {
    document.getElementById('modal').classList.add('hidden');
  }
});

// Modal close behavior
modalClose.addEventListener("click", () => modal.classList.add("hidden"));
window.addEventListener("keydown", e => {
  if (e.key === "Escape") modal.classList.add("hidden");
});
