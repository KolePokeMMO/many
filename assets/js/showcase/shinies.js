let shinyShowcaseInitialized = false;

function initShinyShowcase() {
  if (shinyShowcaseInitialized) return;
  shinyShowcaseInitialized = true;

  const grid = document.getElementById('shiny-grid');
  const controls = document.getElementById('shiny-controls');
  const pagination = document.getElementById('pagination');
  if (!grid || !controls || !pagination) return;

  const filters = controls.querySelectorAll('select, input');
  let shinyData = [];
  const state = { search:'', region:'', shiny_type:'', encounter:'', alpha:false, page:1, perPage:20 };

  filters.forEach(f => {
    f.addEventListener('input', () => {
      state[f.name] = f.type === 'checkbox' ? f.checked : f.value;
      state.page = 1;
      renderCards();
    });
  });

  fetch('/many/assets/data/shinies.json')
    .then(r => r.json())
    .then(data => {
      shinyData = data.sort((a,b) => new Date(b.caught_on) - new Date(a.caught_on));
      renderCards();
    });

  function renderCards() {
    const filtered = shinyData.filter(s =>
      (!state.region || s.region === state.region) &&
      (!state.shiny_type || s.shiny_type === state.shiny_type) &&
      (!state.encounter || s.encounter === state.encounter) &&
      (!state.alpha || s.alpha) &&
      (!state.search || [s.name,s.trainer,s.location].some(v => (v||'').toLowerCase().includes(state.search.toLowerCase())))
    );

    const start = (state.page-1)*state.perPage;
    const pageData = filtered.slice(start, start + state.perPage);

    grid.innerHTML = '';
    pageData.forEach(shiny => {
      const card = document.createElement('div');
      card.className = 'shiny-card';
      card.innerHTML = `
        <div class="shiny-card-inner">
          <div class="shiny-card-front">
            <img src="${shiny.sprite_shiny}" />
            <div class="card-front-info">
              <strong>${shiny.trainer}</strong>
              <span>#${shiny.shiny_number}</span>
              <span>${shiny.caught_on}</span>
            </div>
          </div>
          <div class="shiny-card-back">
            <strong>${shiny.name} (#${shiny.dex})</strong>
            <p>${shiny.location} | ${shiny.encounter}</p>
            <p>${shiny.region} | Phase ${shiny.phase}</p>
            <p>Trainer: ${shiny.trainer}</p>
            <p><em>Click for more info</em></p>
          </div>
        </div>`;
      card.onclick = () => showModal(shiny);
      grid.appendChild(card);
    });

    pagination.innerHTML = '';
    const totalPages = Math.ceil(filtered.length / state.perPage);
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = i === state.page ? 'active' : '';
      btn.textContent = i;
      btn.onclick = () => { state.page = i; renderCards(); };
      pagination.appendChild(btn);
    }
  }
}

document.addEventListener('DOMContentLoaded', initShinyShowcase);

// Modal with requestAnimationFrame fix
// Modal and Escape close logic unchanged
function showModal(shiny) {
  document.querySelector('.shiny-modal')?.remove();
  document.removeEventListener('keydown', escClose);

  const modal = document.createElement('div');
  modal.className = 'shiny-modal';

  modal.innerHTML = `
    <div class="shiny-modal-content">
      <button class="shiny-modal-close" aria-label="Close modal">✕</button>
      <h2>
        ${shiny.name} OT <span>#${shiny.dex}</span> 
        ${shiny.alpha ? `<span class="badge alpha">Alpha</span>` : ''}
        <span class="badge shiny-type">${shiny.shiny_type || 'Shiny'}</span>
      </h2>
      <div class="sprites-row">
        <div>
          <div class="sprite-label">Normal</div>
          <img src="${shiny.sprite_normal}" alt="${shiny.name} normal sprite" />
        </div>
        <div>
          <div class="sprite-label">Shiny</div>
          <img src="${shiny.sprite_shiny}" alt="${shiny.name} shiny sprite" />
        </div>
      </div>
      <div class="modal-tabs">
        <button class="tab active" data-tab="overview">Overview</button>
        <button class="tab" data-tab="risk">Risk</button>
        <button class="tab" data-tab="extra">Extra</button>
      </div>
      <div class="tab-content active" id="overview">
        <p><strong>Caught on:</strong> ${shiny.caught_on}</p>
        <p><strong>Location:</strong> ${shiny.region} / ${shiny.location}</p>
        <p><strong>Encounter:</strong> ${shiny.encounter}</p>
        <p><strong>Phase #:</strong> ${shiny.phase}</p>
        <p><strong>Trainer:</strong> ${shiny.trainer}</p>
        <p><strong>Game:</strong> ${shiny.game}</p>
        <p><strong>Ball Used:</strong> ${shiny.ball_used || 'Unknown'}</p>
      </div>
      <div class="tab-content" id="risk">
        <p><strong>Dangerous Move:</strong> ${shiny.dangerous_move || 'None'}</p>
        <p><strong>Dangerous Ability:</strong> ${shiny.dangerous_ability || 'None'}</p>
      </div>
      <div class="tab-content" id="extra">
        <p><strong>Total Shinies:</strong> ${shiny.total_shinies || 0}</p>
        <p><strong>Shiny Number:</strong> ${shiny.shiny_number || 0}</p>
        <p><strong>Notes:</strong> ${shiny.notes || 'None'}</p>
        <p><strong>Types:</strong> ${shiny.pokemon_types ? shiny.pokemon_types.join(', ') : 'Unknown'}</p>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const tabs = modal.querySelectorAll('.tab');
  const contents = modal.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      modal.querySelector(`#${tab.dataset.tab}`).classList.add('active');
    });
  });

  modal.querySelector('.shiny-modal-close').addEventListener('click', () => {
    modal.remove();
    document.removeEventListener('keydown', escClose);
  });

  document.addEventListener('keydown', escClose);
}

function escClose(e) {
  if (e.key === "Escape") {
    document.querySelector('.shiny-modal')?.remove();
    document.removeEventListener('keydown', escClose);
  }
}
