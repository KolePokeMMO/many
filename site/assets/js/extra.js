/* CLOSE DOWN THE SITE
(function redirectUnlessLocalhost() {
  const allowedHosts = ['127.0.0.1:8000', 'localhost:8000'];
  const isLocalhost = allowedHosts.includes(location.host);

  // Already at locked.html
  const isLocked = location.href.includes('/many/sorry.html');

  if (!isLocalhost && !isLocked) {
    // Always redirect to locked.html at the root of /many/
    location.replace('https://shinylegion.github.io/many/sorry.html');
  }
})();
*/

document.addEventListener("DOMContentLoaded", function () {
  if (window.location.pathname.endsWith("/honey-trees/")) {
    document.body.classList.add("page-honey-trees");
  }
});

function setTheme(theme) {
  // Just set the data-theme attribute, no CSS files loaded
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('selectedTheme', theme);
}

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('selectedTheme') || 'shiny';
  setTheme(savedTheme);

  // Highlight the selected icon
  document.querySelectorAll('.theme-buttons button').forEach(btn => {
    if (btn.dataset.theme === savedTheme) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  // Bind buttons to switch theme by setting data-theme
  document.querySelectorAll('.theme-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      setTheme(theme);

      // Update active state
      document.querySelectorAll('.theme-buttons button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

});

// Inject SVG logo inline for theme-aware colouring
fetch('/many/assets/img/logo-lux.svg')
  .then(response => response.text())
  .then(svg => {
    if (!svg.includes('<svg')) return; // sanity check on fetched content

    const container = document.getElementById('lux-logo');
    if (!container) return; // ✅ Don't continue if element not found

    container.innerHTML = svg;

    const svgEl = container.querySelector('svg');
    if (svgEl) {
      svgEl.classList.add('injected-logo');
      svgEl.setAttribute('role', 'img');
      svgEl.setAttribute('aria-label', 'Team Mascot');
    }
  });


// Inject Spiritomb if present
fetch('/many/assets/img/spiritomb.svg')
  .then(response => response.text())
  .then(svg => {
    const container = document.getElementById('spiritomb');
    if (!container) return; // ✅ Prevent crash if not present

    container.innerHTML = svg;

    const svgEl = container.querySelector('svg');
    if (svgEl) {
      svgEl.classList.add('injected-spiritomb');
      svgEl.setAttribute('role', 'img');
      svgEl.setAttribute('aria-label', 'Team Mascot');
    }
  })
  .catch(err => {
    console.error('Failed to load SVG:', err);
  });





document.addEventListener('DOMContentLoaded', () => {
  let lastScrollY = window.scrollY;
  let rotation = 0;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;

    rotation += delta * 0.5;
    rotation %= 360;

    document.querySelectorAll('.glowing-border-spin').forEach(el => {
      el.style.setProperty('--border-rotation', `${rotation}deg`);
    });

    lastScrollY = currentScrollY;
  });
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
