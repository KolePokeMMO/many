function initPhenoTracker() {
  const grid = document.getElementById('pheno-grid');
  const template = document.getElementById('pheno-card-template');
  const filterCheckbox = document.getElementById('filter-missing');

  if (!grid || !template) return;

  fetch('/many/assets/data/pheno-data.json')
    .then(res => res.json())
    .then(phenoData => {
      // Load saved caught state from localStorage
      const saved = localStorage.getItem('pheno-data');
      if (saved) {
        try {
          const savedMap = Object.fromEntries(
            JSON.parse(saved).map(p => [p.dex, p.caught])
          );
          phenoData.forEach(p => {
            p.caught = savedMap[p.dex] ?? false;
          });
        } catch (e) {
          console.warn('Failed to parse saved pheno-data:', e);
        }
      }

      function render() {
        grid.innerHTML = '';
        let renderedCount = 0;

        phenoData.forEach(p => {
          if (filterCheckbox.checked && p.caught) {
            console.log(`Skipping ${p.name} - already caught`);
            return;
          }

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
            render(); // Re-render to apply filtering and update UI
          });

          grid.appendChild(card);
          renderedCount++;
        });

        console.log(`Rendered ${renderedCount} phenos (filter: ${filterCheckbox.checked ? 'missing only' : 'all'})`);
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
