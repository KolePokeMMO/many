document.addEventListener("DOMContentLoaded", () => {
  const ellipsis = document.querySelector(".md-header__title .md-ellipsis");

  if (ellipsis && ellipsis.textContent.includes("MANY")) {
    ellipsis.innerHTML = `

      <span class="many">MANY</span>
    `;
  }
});
