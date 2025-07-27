function initPhenoTracker() {
  const grid = document.getElementById('pheno-grid');
  const template = document.getElementById('pheno-card-template');
  const filterCheckbox = document.getElementById('filter-missing');

  if (!grid || !template) return; // Fail silently if on wrong page

  fetch('/many/assets/data/pheno-data.json')
    .then(res => res.json())
    .then(phenoData => {
      function render() {
        grid.innerHTML = '';
        phenoData.forEach(p => {
          if (filterCheckbox.checked && p.caught) return;

          const card = template.content.cloneNode(true);
          card.querySelector('.pheno-name').textContent = p.name;
          card.querySelector('.pheno-sprite').src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.dex}.png`;
          card.querySelector('.pheno-types').textContent = `Type: ${p.types.join(', ')}`;
          card.querySelector('.pheno-method').innerHTML = `<strong>Method:</strong> ${p.method}`;
          card.querySelector('.pheno-locations').innerHTML = `<strong>Locations:</strong> ${p.locations.join(', ')}`;

          const toggle = card.querySelector('.caught-toggle');
          toggle.checked = p.caught;
          toggle.addEventListener('change', () => {
            p.caught = toggle.checked;
            localStorage.setItem('pheno-data', JSON.stringify(phenoData));
            render();
          });

          grid.appendChild(card);
        });
      }

      const saved = localStorage.getItem('pheno-data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          parsed.forEach((p, i) => phenoData[i].caught = p.caught ?? false);
        } catch {}
      }

      filterCheckbox.addEventListener('change', render);
      render();
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhenoTracker);
} else {
  initPhenoTracker();
}
