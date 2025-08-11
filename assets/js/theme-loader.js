document.addEventListener("DOMContentLoaded", () => {
  const theme = localStorage.getItem("selectedTheme") || "shiny";
  document.documentElement.setAttribute("data-theme", theme);
  document.body.style.display = "block"; // always show page
});

