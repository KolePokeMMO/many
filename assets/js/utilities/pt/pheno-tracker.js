document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("pheno-grid");
  const template = document.getElementById("pheno-card-template");
  const filterCheckbox = document.getElementById("filter-missing");
  const resetButton = document.getElementById("reset-pheno");
  const counter = document.getElementById("pheno-counter");
  const progressFill = document.getElementById("pheno-progress-fill");

  let phenoData = [];

  function getSavedCaughtMap() {
    return JSON.parse(localStorage.getItem("pheno-tracker") || "{}");
  }

  function saveCaughtMap() {
    const map = {};
    phenoData.forEach(p => (map[p.name] = p.caught));
    localStorage.setItem("pheno-tracker", JSON.stringify(map));
  }

  function applySavedCaughtStatus(data) {
    const saved = getSavedCaughtMap();
    return data.map(p => ({ ...p, caught: !!saved[p.name] }));
  }

  function triggerConfetti() {
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }

  function updateProgress() {
    const total = phenoData.length;
    const caught = phenoData.filter(p => p.caught).length;

    counter.textContent = `${caught} / ${total} caught`;
    const percent = (caught / total) * 100;
    progressFill.style.width = `${percent}%`;

    if (caught === total) {
      triggerConfetti();
    }
  }

  function render() {
    grid.innerHTML = '';

    phenoData.forEach(p => {
      if (filterCheckbox.checked && p.caught) return;

      const card = template.content.cloneNode(true);

      card.querySelector('.pheno-name').textContent = p.name;
      card.querySelector('.pheno-sprite').src =
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.dex}.png`;
      card.querySelector('.pheno-types').textContent = `Type: ${p.types.join(', ')}`;
      card.querySelector('.pheno-locations').innerHTML =
        `<strong>Locations:</strong> ${p.locations.join(', ')}`;
      card.querySelector('.pheno-method').innerHTML =
        `<strong>Method:</strong> ${p.method}`;

      const toggle = card.querySelector('.caught-toggle');
      toggle.checked = p.caught;

      toggle.addEventListener('change', () => {
        p.caught = toggle.checked;
        saveCaughtMap();
        render(); // Re-render to apply filter
      });

      grid.appendChild(card);
    });

    updateProgress();
  }

  resetButton.addEventListener('click', () => {
    localStorage.removeItem("pheno-tracker");
    phenoData.forEach(p => (p.caught = false));
    render();
  });

  fetch('/many/assets/data/pheno-data.json')
    .then(res => res.json())
    .then(data => {
      phenoData = applySavedCaughtStatus(data);
      filterCheckbox.addEventListener('change', render);
      render();
    })
    .catch(err => {
      grid.innerHTML = `<p style="color:red;">Failed to load Pheno data.</p>`;
      console.error(err);
    });
});
