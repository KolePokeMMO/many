document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const fileInput = document.getElementById('encounterFile');
    const form = document.getElementById('characterForm');
    const uploadSuccess = document.getElementById('uploadSuccess');
    const downloadBtn = document.getElementById('downloadJson');
    const prngGrid = document.getElementById('prng-grid');

    const playerNameInput = document.getElementById('playerName');
    const charNameInput = document.getElementById('charName');
    const regionSelect = document.getElementById('region');
    const notesInput = document.getElementById('notes');
    const completedCheckbox = document.getElementById('completedRun');
    const hoursInput = document.getElementById('hoursPlayed');

    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const regionFilter = document.getElementById('regionFilter');
    const shinyFilter = document.getElementById('shinyFilter');

    // In-memory dataset
    let prngData = [];
    let newEntry = null;

    // Show/hide hours input based on completed checkbox
    completedCheckbox.addEventListener('change', () => {
        if (completedCheckbox.checked) {
            hoursInput.style.display = 'inline-block';
            hoursInput.required = true;
        } else {
            hoursInput.style.display = 'none';
            hoursInput.required = false;
            hoursInput.value = '';
        }
    });

    // Load prng.json from server
    async function loadPrngData() {
        try {
            const res = await fetch('/many/assets/data/prng/prng.json');
            if (!res.ok) throw new Error('Failed to load PRNG data');
            prngData = await res.json();
            renderGrid(prngData);
        } catch (e) {
            console.error('Error loading prng.json:', e);
            prngGrid.innerHTML = '<p style="color:#f88">Failed to load data.</p>';
        }
    }

    // Parse Archetype .txt file content to stats object
    function parseArchetypeTxt(text) {
        const stats = {
            encounters: 0,
            eggs: 0,
            fossils: 0,
            alphas: 0,
            legendaries: 0,
            shinyCount: 0,
            battles: {
                single: 0,
                double: 0,
                triple: 0,
                horde: 0
            }
        };

        const lines = text.split('\n');
        const mapping = {
            'Encountered_Count': 'encounters',
            'Egg_Count': 'eggs',
            'Fossil_Count': 'fossils',
            'Alpha_Count': 'alphas',
            'Legendary_Count': 'legendaries',
            'Shiny_Count': 'shinyCount',
            'Single_Battle': 'single',
            'Double_Battle': 'double',
            'Triple_Battle': 'triple',
            'Horde_Battle': 'horde'
        };

        lines.forEach(line => {
            for (const key in mapping) {
                if (line.startsWith(key)) {
                    const val = parseInt(line.split('=')[1]) || 0;
                    if (['Single_Battle', 'Double_Battle', 'Triple_Battle', 'Horde_Battle'].includes(key)) {
                        stats.battles[mapping[key]] = val;
                    } else {
                        stats[mapping[key]] = val;
                    }
                }
            }
        });

        return stats;
    }

    // Show form and pre-fill with parsed data
    function showFormWithParsedData(stats) {
        form.style.display = 'block';
        uploadSuccess.style.display = 'none';

        playerNameInput.value = '';
        charNameInput.value = '';
        regionSelect.value = '';
        notesInput.value = '';
        completedCheckbox.checked = false;
        hoursInput.style.display = 'none';
        hoursInput.required = false;
        hoursInput.value = '';

        newEntry = { ...stats };
    }

    // Handle file upload
    fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            const text = event.target.result;
            const parsedStats = parseArchetypeTxt(text);
            showFormWithParsedData(parsedStats);
        };
        reader.readAsText(file);
    });

    // Handle form submission
    form.addEventListener('submit', e => {
        e.preventDefault();

        const character = {
            characterName: charNameInput.value.trim(),
            region: regionSelect.value,
            status: completedCheckbox.checked ? 'Completed' : 'Active',
            dateCompleted: completedCheckbox.checked ? new Date().toISOString().slice(0, 10) : null,
            hoursPlayed: completedCheckbox.checked ? parseFloat(hoursInput.value) || null : null,
            encounters: newEntry.encounters || 0,
            shinyCount: newEntry.shinyCount || 0,
            eggs: newEntry.eggs || 0,
            fossils: newEntry.fossils || 0,
            alphas: newEntry.alphas || 0,
            legendaries: newEntry.legendaries || 0,
            battles: newEntry.battles || { single: 0, double: 0, triple: 0, horde: 0 },
            notes: notesInput.value.trim() || ''
        };

        const playerName = playerNameInput.value.trim();
        if (!playerName) {
            alert('Please enter your player name.');
            return;
        }

        let playerObj = prngData.find(p => p.player.toLowerCase() === playerName.toLowerCase());
        if (!playerObj) {
            playerObj = { player: playerName, characters: [] };
            prngData.push(playerObj);
        }
        playerObj.characters.push(character);

        uploadSuccess.style.display = 'block';
        form.style.display = 'none';

        const blob = new Blob([JSON.stringify(prngData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const tempLink = document.createElement('a');
        tempLink.href = url;
        tempLink.download = `prng-${playerName.replace(/\s+/g, '_').toLowerCase()}.json`;
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        fileInput.value = '';

        renderGrid(prngData);
    });

    // Handle download button cleanup
    downloadBtn.addEventListener('click', () => {
        setTimeout(() => URL.revokeObjectURL(downloadBtn.href), 1000);
    });

    // Filter and search helpers
    function filterAndSearchData() {
        let filtered = JSON.parse(JSON.stringify(prngData)); // deep clone

        const searchTerm = searchInput.value.trim().toLowerCase();
        const statusTerm = statusFilter.value;
        const regionTerm = regionFilter.value;
        const shinyTerm = shinyFilter.value;

        if (searchTerm) {
            filtered = filtered
                .map(player => {
                    const filteredChars = player.characters.filter(c =>
                        c.characterName.toLowerCase().includes(searchTerm) ||
                        player.player.toLowerCase().includes(searchTerm)
                    );
                    return filteredChars.length > 0 ? { ...player, characters: filteredChars } : null;
                })
                .filter(Boolean);
        }

        if (statusTerm) {
            filtered = filtered
                .map(player => {
                    const filteredChars = player.characters.filter(c => c.status === statusTerm);
                    return filteredChars.length > 0 ? { ...player, characters: filteredChars } : null;
                })
                .filter(Boolean);
        }

        if (regionTerm) {
            filtered = filtered
                .map(player => {
                    const filteredChars = player.characters.filter(c => c.region === regionTerm);
                    return filteredChars.length > 0 ? { ...player, characters: filteredChars } : null;
                })
                .filter(Boolean);
        }

        if (shinyTerm) {
            filtered = filtered
                .map(player => {
                    const filteredChars = player.characters.filter(c => {
                        if (shinyTerm === 'Yes') return c.shinyCount > 0;
                        if (shinyTerm === 'No') return c.shinyCount === 0;
                        return true;
                    });
                    return filteredChars.length > 0 ? { ...player, characters: filteredChars } : null;
                })
                .filter(Boolean);
        }

        return filtered;
    }

    const clearFiltersBtn = document.getElementById('clearFilters');

    clearFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        statusFilter.value = '';
        regionFilter.value = '';
        shinyFilter.value = '';
        renderGrid(prngData);
    });

    // Render character cards grid
    function renderGrid(data) {
        prngGrid.innerHTML = '';
        if (!data.length) {
            prngGrid.innerHTML = '<p style="color:#ccc">No character data available.</p>';
            return;
        }

        const filteredData = filterAndSearchData();

        if (!filteredData.length) {
            prngGrid.innerHTML = '<p style="color:#ccc">No characters match your filters.</p>';
            return;
        }

        filteredData.forEach(player => {
            const playerSection = document.createElement('section');
            playerSection.classList.add('player-section');

            const playerTitle = document.createElement('h3');
            playerTitle.textContent = player.player;
            playerSection.appendChild(playerTitle);

            const charGrid = document.createElement('div');
            charGrid.classList.add('char-grid');

            player.characters.forEach(character => {
                const card = createCharCard(character);
                charGrid.appendChild(card);
            });

            playerSection.appendChild(charGrid);
            prngGrid.appendChild(playerSection);
        });
    }

    // Create single character card element
    function createCharCard(char) {
        const card = document.createElement('div');
        card.classList.add('char-card');

        const statusClass = char.status === 'Completed' ? 'status-completed' : 'status-active';

        card.innerHTML = `
      <div class="card-header">
        <h4>${char.characterName}</h4>
        <span class="status ${statusClass}">${char.status}</span>
      </div>
      <p><strong>Region:</strong> ${char.region}</p>
      <p><strong>Encounters:</strong> ${char.encounters}</p>
      <p><strong>Eggs:</strong> ${char.eggs}</p>
      <p><strong>Fossils:</strong> ${char.fossils}</p>
      <p><strong>Alphas:</strong> ${char.alphas}</p>
      <p><strong>Legendaries:</strong> ${char.legendaries}</p>
      <p><strong>Shinies:</strong> ${char.shinyCount}</p>
      <p><strong>Battles:</strong> Single: ${char.battles.single}, Double: ${char.battles.double}, Triple: ${char.battles.triple}, Horde: ${char.battles.horde}</p>
      ${char.dateCompleted ? `<p><strong>Completed:</strong> ${char.dateCompleted}</p>` : ''}
      ${char.hoursPlayed !== null && char.hoursPlayed !== undefined ? `<p><strong>Hours Played:</strong> ${char.hoursPlayed}</p>` : ''}
      ${char.notes ? `<p><em>${char.notes}</em></p>` : ''}
    `;

        return card;
    }

    const soloToggle = document.getElementById("solo-toggle");
    const soloPanel = document.getElementById("solo-slideout");

    const suppliesToggle = document.getElementById("supplies-toggle");
    const suppliesPanel = document.getElementById("supplies-slideout");

    soloToggle.addEventListener("click", () => {
        const isVisible = soloPanel.classList.toggle("visible");

        // Just slide the solo panel, no button text change

        // If showing solo panel, hide supplies panel
        if (isVisible && suppliesPanel.classList.contains("visible")) {
            suppliesPanel.classList.remove("visible");
        }
    });

    suppliesToggle.addEventListener("click", () => {
        const isVisible = suppliesPanel.classList.toggle("visible");

        // Just slide the supplies panel, no button text change

        // If showing supplies panel, hide solo panel
        if (isVisible && soloPanel.classList.contains("visible")) {
            soloPanel.classList.remove("visible");
        }
    });

    document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const panel = btn.parentElement;
        panel.classList.remove('visible');
    });
    });

    // Initial load
    loadPrngData();
});
