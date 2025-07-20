const PASSWORD = 'shiny123'; // 🔒 Replace with a real password

function checkPassword() {
  const input = document.getElementById('admin-pass').value;
  if (input === PASSWORD) {
    document.getElementById('admin-pass').style.display = 'none';
    event.target.style.display = 'none';
    loadAdminUI();
  } else {
    alert('Incorrect password.');
  }
}

function loadAdminUI() {
  fetch('/many/assets/data/shinies.json')
    .then(res => res.json())
    .then(data => renderAdmin(data));
}

function renderAdmin(data) {
  const container = document.getElementById('admin-content');
  container.style.display = 'block';

  const uniqueCounts = {};
  data.forEach(entry => {
    const name = entry.name.toLowerCase();
    uniqueCounts[name] = (uniqueCounts[name] || 0) + 1;
  });

  const form = `
    <form id="new-entry-form" onsubmit="event.preventDefault(); addEntry();">
      <h3>Add New Entry</h3>
      <input name="name" placeholder="Name" required />
      <input name="caught_on" placeholder="Caught On" />
      <input name="location" placeholder="Location (default N/A)" />
      <input name="trainer" placeholder="Trainer" />
      <input name="shiny_number" type="number" placeholder="Shiny #" />
      <input name="region" placeholder="Region" />
      <input name="encounter" placeholder="Encounter Method" />
      <input name="phase" type="number" placeholder="Phase (default 1)" />
      <input name="shiny_type" placeholder="Shiny Type" />
      <label><input name="alpha" type="checkbox" /> Alpha</label>
      <button type="submit">Add</button>
    </form>
    <br/>
    <input id="search-box" placeholder="Search by name, trainer, location..." oninput="filterTable()" />
    <button onclick="downloadJSON()">Download JSON</button>
  `;

  const table = `
    <table id="shiny-table">
      <thead>
        <tr>
          <th>Name</th><th>Caught On</th><th>Location</th><th>Trainer</th><th>Shiny #</th>
          <th>Region</th><th>Encounter</th><th>Phase</th><th>Shiny Type</th><th>Alpha</th><th>Notes</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((s, i) => {
          const name = s.name.toLowerCase();
          const normalSprite = `https://projectpokemon.org/images/normal-sprite/${name}.gif`;
          const shinySprite = `https://projectpokemon.org/images/shiny-sprite/${name}.gif`;
          return `
            <tr data-index="${i}">
              <td><input value="${s.name}" /></td>
              <td><input value="${s.caught_on}" /></td>
              <td><input value="${s.location || 'N/A'}" /></td>
              <td><input value="${s.trainer}" /></td>
              <td><input type="number" value="${s.shiny_number}" /></td>
              <td><input value="${s.region}" /></td>
              <td><input value="${s.encounter}" /></td>
              <td><input type="number" value="${s.phase || 1}" /></td>
              <td><input value="${s.shiny_type}" /></td>
              <td><input type="checkbox" ${s.alpha ? 'checked' : ''} /></td>
              <td><input value="${s.notes || 'N/A'}" /></td>
              <td><button onclick="deleteRow(${i})">Delete</button></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = form + table;
  window.shinyAdminData = data;
}

function deleteRow(index) {
  shinyAdminData.splice(index, 1);
  renderAdmin(shinyAdminData);
}

function addEntry() {
  const form = document.getElementById('new-entry-form');
  const data = new FormData(form);
  const name = data.get('name');
  const nameLower = name.toLowerCase();
  const newEntry = {
    name,
    dex: 0,
    caught_on: data.get('caught_on') || '',
    sprite_normal: `https://projectpokemon.org/images/normal-sprite/${nameLower}.gif`,
    sprite_shiny: `https://projectpokemon.org/images/shiny-sprite/${nameLower}.gif`,
    location: data.get('location') || 'N/A',
    trainer: data.get('trainer') || '',
    notes: 'N/A',
    shiny_number: parseInt(data.get('shiny_number')) || 0,
    total_shinies: shinyAdminData.filter(s => s.name.toLowerCase() === nameLower).length + 1,
    region: data.get('region') || '',
    encounter: data.get('encounter') || '',
    phase: parseInt(data.get('phase')) || 1,
    dangerous_move: '',
    dangerous_ability: '',
    shiny_type: data.get('shiny_type') || '',
    alpha: data.get('alpha') === 'on',
    ball_used: '',
    game: '',
    pokemon_types: []
  };
  shinyAdminData.push(newEntry);
  form.reset();
  renderAdmin(shinyAdminData);
}

function downloadJSON() {
  const rows = document.querySelectorAll('#shiny-table tbody tr');
  const updated = [];
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const index = parseInt(row.dataset.index, 10);
    const name = inputs[0].value.toLowerCase();
    updated.push({
      name: inputs[0].value,
      dex: 0,
      caught_on: inputs[1].value,
      sprite_normal: `https://projectpokemon.org/images/normal-sprite/${name}.gif`,
      sprite_shiny: `https://projectpokemon.org/images/shiny-sprite/${name}.gif`,
      location: inputs[2].value || 'N/A',
      trainer: inputs[3].value,
      notes: inputs[10].value || 'N/A',
      shiny_number: parseInt(inputs[4].value),
      total_shinies: shinyAdminData.filter(s => s.name.toLowerCase() === name).length,
      region: inputs[5].value,
      encounter: inputs[6].value,
      phase: parseInt(inputs[7].value) || 1,
      dangerous_move: '',
      dangerous_ability: '',
      shiny_type: inputs[8].value,
      alpha: inputs[9].checked,
      ball_used: '',
      game: '',
      pokemon_types: []
    });
  });

  const blob = new Blob([JSON.stringify(updated, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shinies.json';
  a.click();
}

function filterTable() {
  const value = document.getElementById('search-box').value.toLowerCase();
  const rows = document.querySelectorAll('#shiny-table tbody tr');
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(value) ? '' : 'none';
  });
}
