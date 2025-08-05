document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("safari-grid");
  const template = document.getElementById("safari-card-template");
  const filterCheckbox = document.getElementById("filter-safari-missing");
  const resetButton = document.getElementById("reset-safari");
  const counter = document.getElementById("safari-counter");
  const progressFill = document.getElementById("safari-progress-fill");
  const zoneTableBody = document.getElementById("zone-table-body");
  const timerDisplay = document.getElementById("rotation-timer");

  let safariData = [];

  function getCaughtMap() {
    return JSON.parse(localStorage.getItem("safari-tracker") || "{}");
  }

  function saveCaughtMap() {
    const map = {};
    safariData.forEach(p => (map[p.name] = p.caught));
    localStorage.setItem("safari-tracker", JSON.stringify(map));
  }

  function applyCaughtStatus(data) {
    const saved = getCaughtMap();
    return data.map(p => ({ ...p, caught: !!saved[p.name] }));
  }

  function renderTimer() {
    const now = new Date();
    const utcNow = new Date(now.toUTCString().slice(0, -4));
    const resetTime = new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), utcNow.getUTCDate() + 1));
    let msLeft = resetTime - utcNow;

    function updateCountdown() {
      const hrs = Math.floor(msLeft / (1000 * 60 * 60));
      const mins = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((msLeft % (1000 * 60)) / 1000);
      timerDisplay.innerHTML = `<strong>Next rotation:</strong> ${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")} (UTC)`;
    }

    updateCountdown();
    setInterval(() => {
      msLeft -= 1000;
      updateCountdown();
    }, 1000);
  }

  function updateProgress() {
    const total = safariData.length;
    const caught = safariData.filter(p => p.caught).length;
    counter.textContent = `${caught} / ${total} caught`;
    progressFill.style.width = `${(caught / total) * 100}%`;
  }

  function renderZones() {
    const zones = [...new Set(safariData.map(p => p.zone))];
    zoneTableBody.innerHTML = '';
    zones.forEach(zone => {
      const rotations = [...new Set(safariData.filter(p => p.zone === zone && p.available).map(p => p.rotation))];
      const keyNames = safariData.filter(p => p.zone === zone && p.available).map(p => p.name).join(', ');

      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${zone}</td><td>${rotations.join(', ') || '—'}</td><td>${keyNames || '—'}</td>`;
      zoneTableBody.appendChild(tr);
    });
  }

  function render() {
    grid.innerHTML = '';
    safariData.forEach(p => {
      if (filterCheckbox.checked && p.caught) return;
      const card = template.content.cloneNode(true);

      card.querySelector('.pheno-name').textContent = p.name;
      card.querySelector('.pheno-sprite').src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.dex}.png`;
      card.querySelector('.pheno-types').textContent = `Type: ${p.types.join(', ')}`;
      card.querySelector('.pheno-locations').innerHTML = `<strong>Zone:</strong> ${p.zone} (${p.rotation})`;
      card.querySelector('.pheno-method').innerHTML = `<strong>Method:</strong> ${p.method}`;

      const toggle = card.querySelector('.caught-toggle');
      toggle.checked = p.caught;

      toggle.addEventListener('change', () => {
        p.caught = toggle.checked;
        saveCaughtMap();
        render();
      });

      if (p.notes) {
        const notes = document.createElement('div');
        notes.className = 'pheno-notes';
        notes.innerHTML = `<em>${p.notes}</em>`;
        card.querySelector('.pheno-card').appendChild(notes);
      }

      grid.appendChild(card);
    });

    updateProgress();
    renderZones();
  }

  resetButton.addEventListener('click', () => {
    localStorage.removeItem("safari-tracker");
    safariData.forEach(p => (p.caught = false));
    render();
  });

  // ✅ Fetch path fixed here — no leading slash
  fetch('/many/assets/data/safari-data.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      safariData = applyCaughtStatus(data);
      filterCheckbox.addEventListener('change', render);
      render();
      renderTimer();
    })
    .catch(err => {
      grid.innerHTML = `<p style="color:red;">Failed to load Safari data.</p>`;
      console.error(err);
    });
});
