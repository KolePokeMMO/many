const el = document.getElementById("team-1789");
if (!el) {
  console.warn("No element found with ID team-1789");
} else {
  // Create filter container
  const filterContainer = document.createElement("div");
  filterContainer.className = "filters";

  const teamFilterInput = document.createElement("input");
  teamFilterInput.type = "text";
  teamFilterInput.placeholder = "Search teammate...";
  filterContainer.appendChild(teamFilterInput);

  const allTeamsFilter = document.createElement("input");
  allTeamsFilter.type = "text";
  allTeamsFilter.placeholder = "Search team...";
  filterContainer.appendChild(allTeamsFilter);

  // Add filters above everything
  el.parentNode.insertBefore(filterContainer, el);

  // Container to hold both sections side-by-side
  const tablesWrapper = document.createElement("div");
  tablesWrapper.className = "shinywars-panes";
  el.replaceWith(tablesWrapper);

  // Create and append your team section
  const yourTeamSection = document.createElement("section");
  yourTeamSection.className = "shinywars";
  tablesWrapper.appendChild(yourTeamSection);

  // Fetch your team
  fetch("https://api.pokemmo.com/api/community-events/1786918700091789313/teams/1789472954291675136")
    .then(res => res.json())
    .then(data => {
      yourTeamSection.innerHTML = `
        <h2>${data.name} – ${data.score.toLocaleString()}</h2>
        <ul>
          ${data.members
            .sort((a, b) => b.score - a.score)
            .map(m => `<li>${m.name} – ${m.score.toLocaleString()}</li>`)
            .join('')}
        </ul>
      `;

      teamFilterInput.addEventListener("input", () => {
        const search = teamFilterInput.value.toLowerCase();
        yourTeamSection.querySelectorAll("li").forEach(li => {
          li.style.display = li.textContent.toLowerCase().includes(search) ? "block" : "none";
        });
      });
    });

  // Create and append all teams section
  const allTeamsSection = document.createElement("section");
  allTeamsSection.className = "shinywars";
  allTeamsSection.id = "all-teams";
  tablesWrapper.appendChild(allTeamsSection);

  fetch("https://api.pokemmo.com/api/community-events/1786918700091789313")
    .then(res => res.json())
    .then(eventData => {
      allTeamsSection.innerHTML = `
        <h3>All Teams – Total Scores</h3>
        <ul>
          ${eventData.teams
            .sort((a, b) => b.score - a.score)
            .map(team => `<li>${team.name} – ${team.score.toLocaleString()}</li>`)
            .join('')}
        </ul>
      `;

      allTeamsFilter.addEventListener("input", () => {
        const search = allTeamsFilter.value.toLowerCase();
        allTeamsSection.querySelectorAll("li").forEach(li => {
          li.style.display = li.textContent.toLowerCase().includes(search) ? "block" : "none";
        });
      });
    });
}
