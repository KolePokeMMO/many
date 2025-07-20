document.addEventListener('DOMContentLoaded', () => {
  fetch('/many/assets/data/shinies.json')
    .then(res => res.json())
    .then(data => {
      const grid = document.getElementById('shiny-grid');
      data.forEach(shiny => {
        const card = document.createElement('div');
        card.className = 'shiny-card';

        card.innerHTML = `
          <div class="shiny-card-inner">
            <div class="shiny-card-front">
              <img src="${shiny.sprite_shiny}" alt="${shiny.name} shiny sprite" />
              <div class="card-front-info">
                <strong>${shiny.trainer}</strong>
                <span>Shiny #${shiny.shiny_number || '-'}</span>
                <span>${shiny.caught_on}</span>
              </div>
            </div>
            <div class="shiny-card-back">
              <strong>${shiny.name} (#${shiny.dex})</strong>
              <span><em>Location:</em> ${shiny.location}</span>
              <span><em>Encounter:</em> ${shiny.encounter || 'Unknown'}</span>
              <span><em>Region:</em> ${shiny.region || 'Unknown'}</span>
              <span><em>Phase:</em> ${shiny.phase || 0}</span>
              <span><em>Trainer:</em> ${shiny.trainer}</span>
              <p><em>Click for more info</em></p>
            </div>
          </div>
        `;

        card.onclick = () => showModal(shiny);
        grid.appendChild(card);
      });
    })
    .catch(err => console.error('Fetch error:', err));
});

function showModal(shiny) {
  const modal = document.createElement('div');
  modal.className = 'shiny-modal';

  modal.innerHTML = `
    <div class="shiny-modal-content">
      <button class="shiny-modal-close" aria-label="Close modal" onclick="this.closest('.shiny-modal').remove()">✕</button>
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

  // Tab switching
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

  // Close on escape
  document.addEventListener('keydown', escClose);
}

function escClose(e) {
  if (e.key === "Escape") {
    document.querySelector('.shiny-modal')?.remove();
    document.removeEventListener('keydown', escClose);
  }
}
