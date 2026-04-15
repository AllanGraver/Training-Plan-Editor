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

/* =====================================================
   DARK / LIGHT MODE TOGGLE
   ===================================================== */

function applyTheme() {
  const isDark = document.body.classList.contains("dark-mode");
  const btn = document.getElementById("themeToggle");
  btn.textContent = isDark ? "Light mode" : "Dark mode";
}

document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("dark-mode");
  applyTheme();
};

// Kør ved load
applyTheme();

/* =========================================================
   LIBRARY LOAD/SAVE
   ========================================================= */

function loadLibrary() {
  const raw = localStorage.getItem("trainingLibrary");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveLibrary(lib) {
  localStorage.setItem("trainingLibrary", JSON.stringify(lib));
}

/* =========================================================
   RENDER PLAN-LISTE (venstre panel)
   ========================================================= */

function renderLibrary() {
  const lib = loadLibrary();
  const container = document.getElementById("sidebarPlans");
  if (!container) return;

  container.innerHTML = "";

  Object.keys(lib).forEach(name => {
    const row = document.createElement("div");
    row.className = "plan-item-row";

    const item = document.createElement("div");
    item.className = "plan-item";
    item.textContent = name;

    if (name === plan.plan_name) {
      item.classList.add("selected");
    }

    item.onclick = () => {
      plan = JSON.parse(JSON.stringify(lib[name]));

      plan.sessions.forEach(s => {
        if (!Array.isArray(s.steps)) s.steps = [];
      });

      selectedWeek = 1;
      selectedSessionIndex = null;

      renderWeeks();
      renderMain();
      renderEditor();
    };

    // ⭐ Skraldespands-ikon
    const del = document.createElement("span");
    del.className = "delete-plan";
    del.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round"
           stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6l-1 14H6L5 6"></path>
        <path d="M10 11v6"></path>
        <path d="M14 11v6"></path>
        <path d="M9 6V4h6v2"></path>
      </svg>
    `;

    del.onclick = (e) => {
      e.stopPropagation(); // klik må ikke åbne planen

      if (confirm(`Slet planen "${name}"?`)) {
        delete lib[name];
        saveLibrary(lib);

        // Hvis den slettede plan var valgt → ryd visning
        if (plan.plan_name === name) {
          plan = { plan_name: "Ny plan", duration_weeks: 12, sessions: [] };
          selectedWeek = 1;
          selectedSessionIndex = null;
          renderWeeks();
          renderMain();
          renderEditor();
        }

        renderLibrary();
      }
    };

    row.appendChild(item);
    row.appendChild(del);
    container.appendChild(row);
  });
}
/* =========================================================
   SESSION-HÅNDTERING
   ========================================================= */

function getSessionsForWeek(week) {
  return plan.sessions.filter(s => s.week === week);
}

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

/* =========================================================
   TILFØJ PAS
   ========================================================= */

function addSession() {
  const sessionsThisWeek = getSessionsForWeek(selectedWeek);

  const newSession = {
    id: Date.now(),
    week: selectedWeek,
    name: `Pas ${sessionsThisWeek.length + 1}`,
    steps: [
      { type: "warmup", durationType: "time", hours: 0, minutes: 5, seconds: 0, notes: "", intensity: "E" },
      { type: "run", mode: "simple", durationType: "distance", distance: 1, notes: "", intensity: "T" },
      { type: "cooldown", durationType: "time", hours: 0, minutes: 5, seconds: 0, notes: "", intensity: "E" }
    ]
  };

  plan.sessions.push(newSession);

  const sessions = getSessionsForWeek(selectedWeek);
  selectedSessionIndex = sessions.length - 1;

  renderMain();
  renderEditor();
}

/* =========================================================
   INIT APP
   ========================================================= */

function initApp() {
  const lib = loadLibrary();
  const names = Object.keys(lib);

  // Hvis der findes planer → vælg første
  if (names.length > 0) {
    plan = JSON.parse(JSON.stringify(lib[names[0]]));
  }

  // ⭐ Sikr at alle sessions har steps-array
  plan.sessions.forEach(s => {
    if (!Array.isArray(s.steps)) s.steps = [];
  });

  selectedWeek = 1;
  selectedSessionIndex = null;

  renderLibrary();
  renderWeeks();
  renderMain();
  renderEditor();
}

/* =========================================================
   WINDOW EXPORTS
   ========================================================= */

window.initApp = initApp;
window.addSession = addSession;
window.renderLibrary = renderLibrary;
window.renderWeeks = renderWeeks;
window.renderSessionsForWeek = renderSessionsForWeek;
