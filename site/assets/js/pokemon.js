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

    const walkAndReplace = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const replaced = node.nodeValue.replace(/\[(p:)?([^\]]+)\]/gi, (match, prefix, content) => {
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

                    const container = document.createElement("span");
                    container.classList.add("pokemon-highlight", "tooltip-container");
                    container.innerHTML = `${poke.name}<span class="tooltip">${tooltip}</span>`;
                    return container.outerHTML;
                }

                // Bracketed text styling
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

            if (replaced !== node.nodeValue) {
                const span = document.createElement("span");
                span.innerHTML = replaced;
                node.replaceWith(...span.childNodes);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Avoid rewriting annotation icons or tooltips
            if (node.closest(".annotate, .annotation")) return;

            Array.from(node.childNodes).forEach(walkAndReplace);
        }
    };

    targetTags.forEach(tag => {
        document.querySelectorAll(tag).forEach(el => {
            if (!el.classList.contains("processed")) {
                walkAndReplace(el);
                el.classList.add("processed");
            }
        });
    });
});
