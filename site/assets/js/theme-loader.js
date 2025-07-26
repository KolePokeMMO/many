// Theme Loader Script
(function () {
  const theme = localStorage.getItem("selectedTheme") || "shiny";
  const html = document.documentElement;

  // Set initial attributes and hide page
  html.setAttribute("data-theme", theme);
  html.classList.add("theme-loading");

  // Load the theme CSS dynamically
  const link = document.createElement("link");
  link.id = "dynamic-theme-css";
  link.rel = "stylesheet";
  link.href = `/many/assets/css/themes/${theme}.css`;

  // Once CSS is loaded, show the page
  link.onload = () => {
    html.classList.remove("theme-loading");
    html.setAttribute("data-theme-loaded", "true");
  };

  // Insert CSS link early in the <head>
  const firstStyle = [...document.head.children].find(el =>
    el.tagName === "STYLE" || el.tagName === "LINK"
  );
  if (firstStyle) {
    document.head.insertBefore(link, firstStyle);
  } else {
    document.head.appendChild(link);
  }

  // Fallback: remove hiding class after a delay (safety)
  setTimeout(() => {
    html.classList.remove("theme-loading");
    html.setAttribute("data-theme-loaded", "true");
  }, 3000);
})();
