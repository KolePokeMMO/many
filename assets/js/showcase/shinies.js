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
              <img src="${shiny.sprite_shiny}" alt="${shiny.name} shiny sprite">
              <strong>${shiny.name}</strong>
            </div>
            <div class="shiny-card-back">
              <span><strong>#${shiny.dex}</strong></span>
              <span><em>Location:</em> ${shiny.location}</span>
              <span><em>Caught on:</em> ${shiny.caught_on}</span>
              <span><em>Trainer:</em> ${shiny.trainer}</span>
              <p><em>Notes:</em> ${shiny.notes}</p>
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
      <button class="shiny-modal-close" onclick="this.closest('.shiny-modal').remove()">✕</button>
      <h2>${shiny.name} <span style="font-size:0.6em;">#${shiny.dex}</span></h2>
      <div style="display:flex; gap:1rem; align-items:center; justify-content:center; margin-bottom:1rem;">
        <div>
          <div style="font-size:0.85em;">Normal</div>
          <img src="${shiny.sprite_normal}" alt="${shiny.name} normal sprite">
        </div>
        <div>
          <div style="font-size:0.85em;">Shiny</div>
          <img src="${shiny.sprite_shiny}" alt="${shiny.name} shiny sprite">
        </div>
      </div>
      <p><strong>Caught on:</strong> ${shiny.caught_on}</p>
      <p><strong>Location:</strong> ${shiny.location}</p>
      <p><strong>Trainer:</strong> ${shiny.trainer}</p>
      <p><strong>Notes:</strong> ${shiny.notes}</p>
    </div>
  `;
  document.body.appendChild(modal);
  document.addEventListener('keydown', escClose);
}

function escClose(e) {
  if (e.key === "Escape") {
    document.querySelector('.shiny-modal')?.remove();
    document.removeEventListener('keydown', escClose);
  }
}
