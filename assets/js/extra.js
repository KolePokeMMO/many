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
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('selectedTheme', theme);
}

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('selectedTheme') || 'shiny';
  setTheme(savedTheme);

  const desktopButtons = document.querySelectorAll('.theme-buttons-desktop button');
  const mobileContainer = document.querySelector('.theme-buttons-mobile');
  const dropdownToggle = mobileContainer.querySelector('.theme-dropdown-toggle');
  const dropdownMenu = mobileContainer.querySelector('.theme-dropdown-menu');

  // Highlight correct desktop button
  desktopButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === savedTheme);
  });

  // Update mobile icon to match active theme
  function updateMobileThemeIcon() {
    const activeBtn = document.querySelector('.theme-buttons-desktop button.active');
    if (activeBtn) {
      dropdownToggle.innerHTML = activeBtn.innerHTML;
    }
  }

  // Fill dropdown with all non-active themes
  function populateDropdown() {
    dropdownMenu.innerHTML = '';
    desktopButtons.forEach(btn => {
      if (!btn.classList.contains('active')) {
        const clone = btn.cloneNode(true);
        dropdownMenu.appendChild(clone);
      }
    });
  }

  // Desktop buttons click
  desktopButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      setTheme(theme);
      desktopButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateMobileThemeIcon();
      populateDropdown();
    });
  });

  // Mobile toggle click
  dropdownToggle.addEventListener('click', () => {
    mobileContainer.classList.toggle('open');
  });

  // Mobile dropdown click
  dropdownMenu.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (btn) {
      const theme = btn.dataset.theme;
      setTheme(theme);

      // Update active state for desktop
      desktopButtons.forEach(b => b.classList.remove('active'));
      document.querySelector(`.theme-buttons-desktop button[data-theme="${theme}"]`)?.classList.add('active');

      updateMobileThemeIcon();
      populateDropdown();
      mobileContainer.classList.remove('open');
    }
  });

  // Initial load
  updateMobileThemeIcon();
  populateDropdown();
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

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.md-sidebar.md-sidebar--primary');
  if (sidebar) {
    sidebar.classList.add('glowing-border-spin');
  }
});