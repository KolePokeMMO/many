document.addEventListener("DOMContentLoaded", async () => {
    const targetTags = ["p", "li"];
    const dexPath = window.location.pathname.includes("/many/")
        ? "/many/assets/data/pokemon.json"
        : "/assets/data/pokemon.json";

    let pokemonData = {};

    try {
        const res = await fetch(dexPath);
        pokemonData = await res.json();
    } catch (err) {
        console.error("Could not load Pokémon data:", err);
    }

    targetTags.forEach(tag => {
        document.querySelectorAll(tag).forEach(el => {
            if (el.classList.contains("processed")) return;

            el.innerHTML = el.innerHTML.replace(/\[(p:)?([^\]]+)\]/gi, (match, prefix, content) => {
                const displayContent = content.trim();

                if (prefix && prefix.toLowerCase() === "p:") {
                    const cleanName = displayContent.toLowerCase();
                    const poke = Array.isArray(pokemonData)
                        ? pokemonData.find(p => p.name.toLowerCase() === cleanName)
                        : pokemonData[cleanName];

                    if (!poke) return `<span class="pokemon-highlight">${displayContent}</span>`;

                    const spriteBase = "https://play.pokemonshowdown.com/sprites/ani";
                    const shinyBase = "https://play.pokemonshowdown.com/sprites/ani-shiny";
                    const safeName = poke.name.toLowerCase().replace(/[^a-z0-9]/g, "");

                    const normalSprite = poke.sprite?.normal ?? `${spriteBase}/${safeName}.gif`;
                    const shinySprite = poke.sprite?.shiny ?? `${shinyBase}/${safeName}.gif`;

                    const statLabels = {
                        hp: "HP",
                        attack: "Atk",
                        defense: "Def",
                        sp_attack: "Sp. Atk",
                        sp_defense: "Sp. Def",
                        speed: "Speed"
                    };

                    const statsHTML = `
                        <div class="stats-grid">
                            ${Object.entries(poke.base_stats).map(([stat, value]) => `
                                <div class="stat-entry">
                                    <span class="stat-label">${statLabels[stat] ?? stat}:</span>
                                    <span class="stat-value">${value}</span>
                                </div>
                            `).join("")}
                        </div>
                    `;

                    const tooltip = `
                        <div class="pokedex-tooltip">
                            <div class="sprite-row">
                                <img src="${normalSprite}" alt="${poke.name}">
                                <img src="${shinySprite}" alt="${poke.name} Shiny">
                            </div>
                            <div><strong>#${poke.dex}</strong> ${poke.name}</div>
                            <div>Type: ${poke.types.map(t => `<span class="type ${t.toLowerCase()}">${t}</span>`).join(" ")}</div>
                            <div>Abilities: ${poke.abilities.join(", ")}${poke.hidden_ability ? `, <em>${poke.hidden_ability}</em>` : ''}</div>
                            <div>Stats:</div>
                            ${statsHTML}
                        </div>
                    `;

                    return `
                        <span class="pokemon-highlight tooltip-container">
                            ${poke.name}
                            <span class="tooltip">${tooltip}</span>
                        </span>`;
                }

                // Generic bracketed text styling
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
