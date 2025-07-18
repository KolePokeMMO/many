document.addEventListener("DOMContentLoaded", () => {
  const ellipsis = document.querySelector(".md-header__title .md-ellipsis");

  if (ellipsis && ellipsis.textContent.includes("Shiny Legion [MANY]")) {
    ellipsis.innerHTML = `
      <span class="shiny-legion">Shiny Legion </span>
      <span class="many">[MANY]</span>
    `;
  }
});
