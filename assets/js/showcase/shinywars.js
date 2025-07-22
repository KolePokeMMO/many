const el = document.getElementById("team-1789");
if (!el) {
  console.warn("No element found with ID team-1789");
} else {
  // Fetch your team data
  fetch("https://api.pokemmo.com/api/community-events/1786918700091789313/teams/1789472954291675136")
    .then(res => res.json())
    .then(data => {
      // Display your team and members
      el.innerHTML = `
        <h2>${data.name} – ${data.score.toLocaleString()}</h2>
        <ul>
          ${data.members
            .sort((a, b) => b.score - a.score)
            .map(m => `<li>${m.name} – ${m.score.toLocaleString()}</li>`)
            .join('')}
        </ul>
      `;
    });

  // Fetch all teams from event
  fetch("https://api.pokemmo.com/api/community-events/1786918700091789313")
    .then(res => res.json())
    .then(eventData => {
      const allTeamsSection = document.createElement("div");
      allTeamsSection.id = "all-teams";

      allTeamsSection.innerHTML = `
        <h3>All Teams – Total Scores</h3>
        <ul>
          ${eventData.teams
            .sort((a, b) => b.score - a.score)
            .map(team => `<li>${team.name} – ${team.score.toLocaleString()}</li>`)
            .join('')}
        </ul>
      `;

      // Insert after your team section
      el.parentNode.insertBefore(allTeamsSection, el.nextSibling);
    });
}

// Filter: Your team
const teamFilterInput = document.createElement("input");
teamFilterInput.type = "text";
teamFilterInput.placeholder = "Search teammate...";
teamFilterInput.classList.add("team-filter");

const yourTeamSection = document.getElementById("team-1789");
yourTeamSection.parentNode.insertBefore(teamFilterInput, yourTeamSection);

teamFilterInput.addEventListener("input", () => {
  const search = teamFilterInput.value.toLowerCase();
  const lis = yourTeamSection.querySelectorAll("li");
  lis.forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(search) ? "block" : "none";
  });
});

// Filter: All teams
const allTeamsFilter = document.createElement("input");
allTeamsFilter.type = "text";
allTeamsFilter.placeholder = "Search team...";
allTeamsFilter.classList.add("team-filter");

const allTeamsDiv = document.getElementById("all-teams");
allTeamsDiv.parentNode.insertBefore(allTeamsFilter, allTeamsDiv);

allTeamsFilter.addEventListener("input", () => {
  const search = allTeamsFilter.value.toLowerCase();
  const lis = allTeamsDiv.querySelectorAll("li");
  lis.forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(search) ? "block" : "none";
  });
});
