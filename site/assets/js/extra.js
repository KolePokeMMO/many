(function redirectUnlessLocalhost() {
  const allowedHosts = ['127.0.0.1:8000', 'localhost:8000'];

  // Don't redirect the locked page itself or if served locally
  const isLocal = allowedHosts.includes(location.host);
  const isLockedPage = location.pathname.includes('/locked.html');

  if (!isLocal && !isLockedPage) {
    location.href = '/many/locked.html';
  }
})();

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
    const container = document.getElementById('lux-logo');
    container.innerHTML = svg;

    // Optional: add a class to the SVG for styling
    const svgEl = container.querySelector('svg');
    if (svgEl) {
      svgEl.classList.add('injected-logo');
      svgEl.setAttribute('role', 'img');
      svgEl.setAttribute('aria-label', 'Team Mascot');
    }
  })

fetch('/many/assets/img/spiritomb.svg')
  .then(response => response.text())
  .then(svg => {
    const container = document.getElementById('spiritomb');
    container.innerHTML = svg;

    // Optional: add a class to the SVG for styling
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
