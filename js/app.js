"use strict";

/* =========================================================
   GLOBAL STATE
   ========================================================= */

let plan = {
  plan_name: "Ny plan",
  duration_weeks: 12,
  race_distance_km: null,
  sessions: []
};

let selectedWeek = 1;
let selectedSessionIndex = null;

/* =========================================================
   UGEHÅNDTERING
   ========================================================= */

function renderWeeks() {
  const weekList = document.getElementById("weekList");
  if (!weekList) return;

  weekList.innerHTML = "";

  for (let w = 1; w <= (plan.duration_weeks || 12); w++) {
    const btn = document.createElement("button");
    btn.textContent = `Uge ${w}`;
    btn.className = (w === selectedWeek) ? "week-button active" : "week-button";
    btn.onclick = () => {
      selectedWeek = w;
      selectedSessionIndex = null;
      renderMain();
      renderEditor();
    };
    weekList.appendChild(btn);
  }

  renderSessionsForWeek();
}

function renderSessionsForWeek() {
  const sessionsThisWeek = plan.sessions.filter(s => s.week === selectedWeek);
  const main = document.getElementById("main");

  if (!main) return;
  if (sessionsThisWeek.length === 0) {
    main.innerHTML = `
      <h2>Ingen pas i uge ${selectedWeek}</h2>
      <p>Tilføj et pas i venstre side.</p>
    `;
    return;
  }

  // Hvis ingen session valgt, vælg første
  if (selectedSessionIndex == null || selectedSessionIndex >= sessionsThisWeek.length) {
    selectedSessionIndex = 0;
  }

  renderMain();
  renderEditor();
}

/* =========================================================
   INIT / LOAD
   ========================================================= */

function initApp() {
  // Forsøg at loade bibliotek og en plan
  const lib = loadLibrary();
  const names = Object.keys(lib);

  if (names.length > 0) {
    plan = JSON.parse(JSON.stringify(lib[names[0]]));
  }

  selectedWeek = 1;
  selectedSessionIndex = null;

  renderLibrary();
  renderWeeks();
  renderMain();
  renderEditor();
}

/* =========================================================
   WINDOW BINDINGS
   ========================================================= */

window.renderWeeks = renderWeeks;
window.renderSessionsForWeek = renderSessionsForWeek;
window.initApp = initApp;

/* =========================================================
   AUTO-INIT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});
