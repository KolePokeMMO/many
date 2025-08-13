// home.js

fetch("assets/data/latest-shinies.json")
  .then(res => res.json())
  .then(data => {
    const shiny = data[Math.floor(Math.random() * data.length)];
    const name = shiny.pokemon;
    const trainer = shiny.trainer;
    const date = shiny.date;

    document.getElementById("latest-shiny-img").src =
      `https://play.pokemonshowdown.com/sprites/gen5ani-shiny/${name.toLowerCase()}.gif`;
    document.getElementById("latest-shiny-img").alt = `Shiny ${name}`;

    document.getElementById("latest-shiny-name").textContent =
      `Shiny ${name.charAt(0).toUpperCase() + name.slice(1)}`;

    document.getElementById("latest-shiny-caption").textContent =
      `Caught by ${trainer} — ${date}`;
  })
  .catch(err => {
    console.error("Error loading shiny data:", err);
    document.getElementById("latest-shiny-caption").textContent = "Unable to load shiny info.";
  });
