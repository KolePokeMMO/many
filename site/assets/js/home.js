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







// home.js

function makeDiscordLinks(text) {
  if (!text) return '';

  // Replace user mentions <@1234567890> with clickable Discord profile links
  text = text.replace(/<@!?(\d+)>/g, (match, userId) => {
    return `<a href="https://discord.com/users/${userId}" target="_blank" rel="noopener noreferrer" class="discord-user-mention">@user</a>`;
  });

  // Replace channel mentions <#1234567890> with clickable Discord channel links
  // Replace YOUR_GUILD_ID below with your actual Discord server ID
  const guildId = '1367253216428953700';
  text = text.replace(/<#(\d+)>/g, (match, channelId) => {
    return `<a href="https://discord.com/channels/${guildId}/${channelId}" target="_blank" rel="noopener noreferrer" class="discord-channel-mention">#channel</a>`;
  });

  // Replace custom emojis <:name:id> and <a:name:id> with actual emoji images
  text = text.replace(/<a?:([^:]+):(\d+)>/g, (match, emojiName, emojiId) => {
    const isAnimated = match.startsWith('<a:');
    const ext = isAnimated ? 'gif' : 'png';
    return `<img src="https://cdn.discordapp.com/emojis/${emojiId}.${ext}" alt=":${emojiName}:" class="discord-emoji" style="height:1em; vertical-align:middle;" />`;
  });

  return text;
}

async function loadLatestAnnouncements() {
  try {
    const response = await fetch('/many/assets/data/discord-feeds/discord-announcements.json');
    if (!response.ok) throw new Error('Failed to load announcements JSON');

    const announcements = await response.json();

    const list = document.getElementById('latest-announcements-list');
    list.innerHTML = ''; // clear loading text

    // Show latest 3 announcements, newest first
    const latest = announcements.slice(-3).reverse();

latest.forEach(announcement => {
  const li = document.createElement('li');

  // Insert a <br> after the first '@everyone' occurrence
  let contentWithBreak = announcement.content.replace(/@everyone/, '@everyone<br>');

  li.innerHTML = `
    <img src="${announcement.avatar}" alt="${announcement.username}'s avatar" class="announcement-avatar" />
    <strong>${announcement.username}:</strong>
    ${contentWithBreak}
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

