// home.js

fetch("assets/data/latest-shinies.json")
    .then(res => res.json())
    .then(data => {
        const shiny = data[Math.floor(Math.random() * data.length)];
        const name = shiny.pokemon;
        const trainer = shiny.trainer;
        const date = shiny.date;

        document.getElementById("latest-shiny-img").src =
            `https://play.pokemonshowdown.com/sprites/gen5ani-shiny/${name.toLowerCase()}.gif`;
        document.getElementById("latest-shiny-img").alt = `Shiny ${name}`;

        document.getElementById("latest-shiny-name").textContent =
            `Shiny ${name.charAt(0).toUpperCase() + name.slice(1)}`;

        document.getElementById("latest-shiny-caption").textContent =
            `Caught by ${trainer} — ${date}`;
    })
    .catch(err => {
        console.error("Error loading shiny data:", err);
        document.getElementById("latest-shiny-caption").textContent = "Unable to load shiny info.";
    });

async function loadLatestAnnouncements() {
    try {
        const response = await fetch('/many/assets/data/discord-feeds/discord-announcements.json');
        if (!response.ok) throw new Error('Failed to load announcements JSON');

        const announcements = await response.json();

        const list = document.getElementById('latest-announcements-list');
        list.innerHTML = ''; // clear loading text

        // Take latest 3 announcements (assuming oldest first in JSON)
        const latest = announcements.slice(-3).reverse();

        latest.forEach(announcement => {
            const li = document.createElement('li');

            // You can customise the display however you want, here’s a simple one:
            li.innerHTML = `
          <strong>${announcement.username}:</strong>
          <span>${announcement.content}</span>
          <br>
          <small>${new Date(announcement.timestamp).toLocaleString()}</small>
        `;

            list.appendChild(li);
        });
    } catch (err) {
        console.error(err);
        const list = document.getElementById('latest-announcements-list');
        list.innerHTML = '<li>Failed to load announcements.</li>';
    }
}

document.addEventListener('DOMContentLoaded', loadLatestAnnouncements);