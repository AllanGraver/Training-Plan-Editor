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

  // Hvis ingen pas → vis info
  if (sessions.length === 0) {
    const empty = document.createElement("div");
    empty.style.padding = "10px 0";
    empty.style.color = "#777";
    empty.textContent = "Ingen træningspas i denne uge endnu.";
    weekCard.appendChild(empty);
  }

  // Vis alle pas
  sessions.forEach((s, i) => {
    const row = document.createElement("div");
    row.className = "session-row";

    row.innerHTML = `
      <div>
        <div class="session-title">${s.title}</div>
        <div class="session-meta">${s.distance_km ?? "-"} km • ${s.duration_min ?? "-"} min</div>
      </div>
      <div>
        <div class="edit-btn" onclick="editSession(${i})">Rediger</div>
        <div class="edit-btn" style="background:#d9534f;margin-top:5px"
             onclick="deleteSession(${i})">Slet</div>
      </div>
    `;

    weekCard.appendChild(row);
  });

  // --- TILFØJ PAS KNAP ---
  const addBtn = document.createElement("button");
  addBtn.textContent = "+ Tilføj pas";
  addBtn.style.marginTop = "15px";
  addBtn.onclick = addSession;

  weekCard.appendChild(addBtn);

  main.appendChild(weekCard);
}

function deleteSession(index) {
  if (!confirm("Vil du slette dette pas?")) return;

  const sessions = plan.sessions.filter(s => s.week === selectedWeek);
  const globalIndex = plan.sessions.indexOf(sessions[index]);

  plan.sessions.splice(globalIndex, 1);

  selectedSessionIndex = null;
  renderMain();
  renderEditor();
}
