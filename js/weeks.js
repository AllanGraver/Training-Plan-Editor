"use strict";
/* =========================================================
   FILE: weeks.js
   PURPOSE:
   - Håndterer uge-listen i venstre panel
   - Viser uger baseret på plan.sessions
   - Skift af selectedWeek og kald til renderSessionsForWeek()
   ========================================================= */

/* ============================
   BEREGN ANTAL UGER
   ============================ */

function getMaxWeekInPlan() {
  if (!plan.sessions || plan.sessions.length === 0) return 1;
  return Math.max(...plan.sessions.map(s => s.week || 1));
}

/* ============================
   RENDER UGE-LISTE
   ============================ */

function renderWeeks() {
  const container = document.getElementById("weekButtons");
  if (!container) return;

  container.innerHTML = "";

  const maxWeek = getMaxWeekInPlan();


  // Uge-knapper
  for (let w = 1; w <= maxWeek; w++) {
    const btn = document.createElement("button");
    btn.className = "week-btn";
    btn.textContent = `Uge ${w}`;

    if (w === selectedWeek) {
      btn.classList.add("selected");
    }

    btn.onclick = () => selectWeek(w);
    container.appendChild(btn);
  }

  // ✅ Tilføj uge-knap (sidst)
  const addBtn = document.createElement("button");
  addBtn.className = "week-btn add-week-btn";
  addBtn.textContent = "+ Tilføj uge";
  addBtn.onclick = (e) => {
    e.stopPropagation();
    addWeek();
  };

  container.appendChild(addBtn);
}

/* ============================
   VÆLG UGE
   ============================ */

function selectWeek(week) {
  selectedWeek = week;
  selectedSessionIndex = null;
  renderSessionsForWeek();
}

/* ============================
   RENDER SESSIONS FOR UGE
   ============================ */

function renderSessionsForWeek() {
  const sessions = getSessionsForWeek(selectedWeek);

  if (sessions.length === 0) {
    selectedSessionIndex = null;
    renderMain();
    renderEditor();
    return;
  }

  if (selectedSessionIndex == null || selectedSessionIndex >= sessions.length) {
    selectedSessionIndex = 0;
  }

  renderMain();
  renderEditor();
}

/* ============================
   WINDOW EXPORTS
   ============================ */
/* ============================
   TILFØJ NY TRÆNINGSUGE
   ============================ */

function addWeek() {
  const maxWeek = getMaxWeekInPlan();
  const newWeek = maxWeek + 1;

  // Tilføj en tom uge (ingen pas endnu)
  plan.sessions.push({
    id: Date.now(),
    week: newWeek,
    name: "Pas 1",
    steps: []
  });

  selectedWeek = newWeek;
  selectedSessionIndex = null;

  renderWeeks();
  renderMain();
  renderEditor();
}
window.renderWeeks = renderWeeks;
window.selectWeek = selectWeek;
window.renderSessionsForWeek = renderSessionsForWeek;
window.addWeek = addWeek;

