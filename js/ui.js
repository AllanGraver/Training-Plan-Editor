function renderWeeks() {
  const weekList = document.getElementById("weekList");
  weekList.innerHTML = "";

  for (let w = 1; w <= plan.duration_weeks; w++) {
    const div = document.createElement("div");
    div.className = "plan-item";
    div.textContent = "Uge " + w;
    div.onclick = () => {
      selectedWeek = w;
      selectedSessionIndex = null;
      renderMain();
      renderEditor();
    };
    weekList.appendChild(div);
  }
}

function renderMain() {
  const main = document.getElementById("main");
  main.innerHTML = "";

  const weekCard = document.createElement("div");
  weekCard.className = "week-card";

  weekCard.innerHTML = `<h2>Uge ${selectedWeek}</h2>`;

  const sessions = plan.sessions.filter(s => s.week === selectedWeek);

  sessions.forEach((s, i) => {
    const row = document.createElement("div");
    row.className = "session-row";

    row.innerHTML = `
      <div>
        <div class="session-title">${s.title}</div>
        <div class="session-meta">${s.distance_km ?? "-"} km • ${s.duration_min ?? "-"} min</div>
      </div>
      <div class="edit-btn" onclick="editSession(${i})">Rediger</div>
    `;

    weekCard.appendChild(row);
  });

  main.appendChild(weekCard);
}
