document.addEventListener("DOMContentLoaded", async () => {
  const targetTags = ["p", "li"];
  const dexPath = "/many/assets/data/pokedex.json"; // adjust if needed
  let pokedex = {};

  try {
    const res = await fetch(dexPath);
    pokedex = await res.json();
  } catch (err) {
    console.error("Could not load Pokédex data:", err);
  }

  targetTags.forEach(tag => {
    document.querySelectorAll(tag).forEach(el => {
      if (el.classList.contains("processed")) return;

      el.innerHTML = el.innerHTML.replace(/\[(p:)?([^\]]+)\]/gi, (match, prefix, content) => {
        const displayContent = content.trim();

        if (prefix && prefix.toLowerCase() === "p:") {
          const poke = pokedex[displayContent.toLowerCase()];
          if (!poke) return `<span class="pokemon-highlight">${displayContent}</span>`;

          const tooltip = `
            <div class="pokedex-tooltip">
              <div class="sprite-row">
                <img src="${poke.sprite.normal}" alt="${poke.name}">
                <img src="${poke.sprite.shiny}" alt="${poke.name} Shiny">
              </div>
              <div><strong>#${poke.dex}</strong> ${poke.name}</div>
              <div>Type: ${poke.types.map(t => `<span class="type ${t.toLowerCase()}">${t}</span>`).join(" ")}</div>
              <div>Abilities: ${poke.abilities.join(", ")}</div>
            </div>
          `;

          return `
            <span class="pokemon-highlight tooltip-container">
              ${poke.name}
              <span class="tooltip">${tooltip}</span>
            </span>`;
        }

        // Generic styling logic
        let cssClass = "bracketed";
        const upper = displayContent.toUpperCase();

        if (/^\d+$/.test(displayContent)) {
          cssClass += " bracketed-number";
        } else if (upper === "HA") {
          cssClass += " bracketed-ha";
        } else if (upper.startsWith("HM")) {
          cssClass += " bracketed-hm";
        } else {
          cssClass += " bracketed-generic";
        }

        return `<span class="${cssClass}">${displayContent}</span>`;
      });

      el.classList.add("processed");
    });
  });
});
