// home.js

// -------------------------
// Random "latest shiny" card (unchanged)
// -------------------------
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

// -------------------------
// Announcements
// -------------------------
function makeDiscordLinks(text) {
    if (!text) return '';

    text = text.replace(/<@!?(\d+)>/g, (match, userId) => {
        return `<a href="https://discord.com/users/${userId}" target="_blank" rel="noopener noreferrer" class="discord-user-mention">@user</a>`;
    });

    const guildId = '1367253216428953700';
    text = text.replace(/<#(\d+)>/g, (match, channelId) => {
        return `<a href="https://discord.com/channels/${guildId}/${channelId}" target="_blank" rel="noopener noreferrer" class="discord-channel-mention">#channel</a>`;
    });

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
        list.innerHTML = '';

        const latest = announcements.slice(-3).reverse();

        latest.forEach(announcement => {
            const li = document.createElement('li');
            const contentWithBreak = (announcement.content || '').replace(/@everyone/, '@everyone<br>');

            li.innerHTML = `
        <img src="${announcement.avatar}" alt="${announcement.username}'s avatar" class="announcement-avatar" referrerpolicy="no-referrer" />
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


// -------------------------
// Group consecutive posts by same user within 10 minutes
// -------------------------
function groupShinyPosts(posts) {
  const grouped = [];
  let lastEntry = null;

  posts.forEach(post => {
    const postTime = new Date(post.timestamp);

    // Extract images from post content
    const contentImages = extractImageUrlsFromContent(post.content);
    // Remove image URLs from raw content
    let cleanedContent = replaceRawImageUrlsWithLinks(post.content);

    if (
      lastEntry &&
      post.username === lastEntry.username &&
      postTime - new Date(lastEntry.timestamp) <= 10 * 60 * 1000
    ) {
      // Merge attachments
      lastEntry.attachments = [...(lastEntry.attachments || []), ...(post.attachments || []), ...contentImages];

      // Merge content text
      lastEntry.content = [lastEntry.content, cleanedContent].filter(Boolean).join("\n");

      // Keep timestamp as earliest (or latest if you prefer)
      if (postTime < new Date(lastEntry.timestamp)) lastEntry.timestamp = post.timestamp;
    } else {
      lastEntry = {
        ...post,
        attachments: [...(post.attachments || []), ...contentImages],
        content: cleanedContent
      };
      grouped.push(lastEntry);
    }
  });

  return grouped;
}



// -------------------------
// Helpers for Latest Shinies
// -------------------------
function isLikelyImageUrl(u) {
    try {
        const url = new URL(u);
        const p = url.pathname.toLowerCase();
        return (
            p.endsWith('.png') ||
            p.endsWith('.jpg') ||
            p.endsWith('.jpeg') ||
            p.endsWith('.gif') ||
            p.endsWith('.webp') ||
            /\/attachments\/.+\.(png|jpe?g|gif|webp)$/i.test(p)
        );
    } catch {
        return false;
    }
}

function normalizeImgur(url) {
    const pageMatch = url.match(/^https?:\/\/(?:www\.)?imgur\.com\/(?:gallery\/|a\/)?([a-zA-Z0-9]+)(?:\.\w+)?(?:[/?].*)?$/);
    if (pageMatch) {
        const id = pageMatch[1];
        return `https://i.imgur.com/${id}.jpg`;
    }

    const directNoExt = url.match(/^https?:\/\/i\.imgur\.com\/([a-zA-Z0-9]+)(?:[/?].*)?$/);
    if (directNoExt) {
        return `https://i.imgur.com/${directNoExt[1]}.jpg`;
    }

    return url;
}

// Extract only image URLs from content for embedding; keep rest of text
function extractImageUrlsFromContent(content) {
    if (!content) return [];

    let urls = [];

    // Match any URL ending with an image extension
    const imageRegex = /(https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp))/gi;
    urls = [...content.matchAll(imageRegex)].map(m => normalizeImgur(m[1]));

    // Remove only image URLs from content text (so normal text stays)
    return [...new Set(urls)];
}

function addImgFallback(imgEl, originalUrl) {
    imgEl.addEventListener('error', () => {
        try {
            const url = new URL(imgEl.src);
            const path = url.pathname.toLowerCase();
            if (path.endsWith('.jpg')) imgEl.src = originalUrl.replace(/\.jpg(\?.*)?$/i, '.png');
            else if (path.endsWith('.png')) imgEl.src = originalUrl.replace(/\.png(\?.*)?$/i, '.jpg');
        } catch { }
    });
}

function replaceRawImageUrlsWithLinks(content) {
    if (!content) return '';
    // Create a temporary div to parse HTML safely
    const div = document.createElement('div');
    div.innerHTML = content;

    // Walk through text nodes only
    const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const replaced = node.nodeValue.replace(
            /(https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp))/gi,
            url => `<a href="${url}" target="_blank" referrerpolicy="no-referrer">Original Image Link</a>`
        );
        if (replaced !== node.nodeValue) {
            const span = document.createElement('span');
            span.innerHTML = replaced;
            node.parentNode.replaceChild(span, node);
        }
    }

    return div.innerHTML;
}

// -------------------------
// Latest Shinies
// -------------------------
async function loadLatestShinies() {
    try {
        const response = await fetch('/many/assets/data/discord-feeds/discord-shiny-flex.json');
        if (!response.ok) throw new Error('Failed to load shiny flex JSON');

        const shinies = await response.json();
        shinies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const container = document.getElementById('latest-shinies-list');
        container.innerHTML = '';

        const filtered = shinies.filter(entry => {
            const fromContent = extractImageUrlsFromContent(entry.content);
            const fromAttachments = (entry.attachments || []).filter(isLikelyImageUrl);
            return fromContent.length > 0 || fromAttachments.length > 0;
        });

        // group by same user within 10 minutes
        const shinyPosts = groupShinyPosts(filtered);


        const latest = shinyPosts.slice(0, 3);

        latest.forEach(entry => {
            const shinyDiv = document.createElement('div');
            shinyDiv.classList.add('shiny-entry');

            // Extract images from content & attachments
            const contentImages = extractImageUrlsFromContent(entry.content);
            const attachmentImages = (entry.attachments || []).filter(isLikelyImageUrl);
            const allImages = [...new Set([...attachmentImages, ...contentImages])].slice(0, 3);

            // Replace raw URLs in content with "Shiny Image" links
            // let contentHtml = replaceRawImageUrlsWithLinks(entry.content);
            let contentHtml = entry.content;  // use merged & preprocessed content

            // Header + content
            shinyDiv.innerHTML = `
        <div class="shiny-user">
          <img src="${entry.avatar}" alt="${entry.username} avatar" class="shiny-avatar" referrerpolicy="no-referrer" />
          <strong>${entry.username}</strong>
        </div>
        <div class="shiny-content">${contentHtml}</div>
      `;

            // Image grid
            if (allImages.length > 0) {
                const grid = document.createElement('div');
                grid.classList.add('shiny-attachments');

                allImages.forEach(rawUrl => {
                    const url = normalizeImgur(rawUrl);
                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = "Shiny attachment";
                    img.className = 'shiny-img';
                    img.referrerPolicy = 'no-referrer';
                    addImgFallback(img, url);
                    img.addEventListener('click', () => openModal(url));
                    grid.appendChild(img);
                });

                shinyDiv.appendChild(grid);
            }

            // Timestamp
            const time = document.createElement('small');
            time.textContent = new Date(entry.timestamp).toLocaleString();
            shinyDiv.appendChild(time);

            container.appendChild(shinyDiv);
        });
    } catch (err) {
        console.error(err);
        const container = document.getElementById('latest-shinies-list');
        container.innerHTML = '<p>Failed to load latest shinies.</p>';
    }
}


// -------------------------
// Modal (centered, max 50% height)
// -------------------------
function openModal(imageUrl) {
    let modal = document.getElementById('shiny-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'shiny-modal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.style.position = 'fixed';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.75)';
        modal.style.zIndex = '9999';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';

        modal.innerHTML = `
      <div class="modal-content" style="position:relative; max-width:90vw; max-height:90vh;">
        <span class="modal-close" style="
          position:absolute;
          top:-12px; right:-12px;
          font-size:2rem; color:#fff; cursor:pointer;
          background:rgba(0,0,0,0.6);
          border-radius:50%;
          padding:0 10px 2px 10px;
          line-height:1;">&times;</span>
        <img src="" alt="Full size shiny" id="modal-img" style="display:block; max-height:50vh; max-width:90vw; border-radius:8px;" referrerpolicy="no-referrer" />
      </div>
    `;
        document.body.appendChild(modal);

        modal.querySelector('.modal-close').onclick = () => {
            modal.style.display = 'none';
        };
        modal.onclick = e => {
            if (e.target === modal) modal.style.display = 'none';
        };
    }

    const modalImg = modal.querySelector('#modal-img');
    modalImg.src = imageUrl;
    modal.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', loadLatestShinies);
