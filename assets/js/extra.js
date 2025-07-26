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
