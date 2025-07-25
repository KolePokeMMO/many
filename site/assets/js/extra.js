document.addEventListener("DOMContentLoaded", function () {
  if (window.location.pathname.endsWith("/honey-trees/")) {
    document.body.classList.add("page-honey-trees");
  }
});

const themeLinkId = 'dynamic-theme-css';

function setTheme(theme) {
  // Update the data-theme attribute immediately
  document.documentElement.setAttribute('data-theme', theme);

  const existing = document.getElementById(themeLinkId);
  if (existing) existing.remove();

  const link = document.createElement('link');
  link.id = themeLinkId;
  link.rel = 'stylesheet';
  link.href = `/many/assets/css/themes/${theme}.css`;
  document.head.appendChild(link);

  localStorage.setItem('selectedTheme', theme);
}


document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('selectedTheme') || 'shiny';
  setTheme(savedTheme);

  // Highlight the selected icon
  document.querySelectorAll('.theme-buttons button').forEach(btn => {
    if (btn.dataset.theme === savedTheme) btn.classList.add('active');
  });

  // Bind buttons
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
