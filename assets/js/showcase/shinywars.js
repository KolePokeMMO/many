const el = document.getElementById("team-1789");
if (!el) {
  console.warn("No element found with ID team-1789");
} else {
  fetch("https://api.pokemmo.com/api/community-events/1786918700091789313/teams/1789472954291675136")
    .then((res) => res.json())
    .then((data) => {
      el.innerHTML = `
        <h3>${data.name} – ${data.score.toLocaleString()}</h3>
        <ul>
          ${data.members.map(m => `<li>${m.name} – ${m.score.toLocaleString()}</li>`).join('')}
        </ul>
      `;
    });
}