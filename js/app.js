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
    const item = document.createElement("div");
    item.className = "plan-item";
    item.textContent = name;

    // ⭐ Markér valgt plan
    if (name === plan.plan_name) {
      item.classList.add("selected");
    }

    item.onclick = () => {
      plan = JSON.parse(JSON.stringify(lib[name]));

      // ⭐ Sikr at alle sessions har steps-array
      plan.sessions.forEach(s => {
        if (!Array.isArray(s.steps)) s.steps = [];
      });

      selectedWeek = 1;
      selectedSessionIndex = null;

      renderWeeks();
      renderMain();
      renderEditor();
    };

    container.appendChild(item);
  });
}

/* =========================================================
   UGE-LISTE
   ========================================================= */

function renderWeeks() {
  const weekList = document.getElementById("weekList");
  if (!weekList) return;

  weekList.innerHTML = "";

  for (let w = 1; w <= (plan.duration_weeks || 12); w++) {
    const btn = document.createElement("button");
    btn.textContent = `Uge ${w}`;

    // ⭐ Sort kant på valgt uge
    btn.className = (w === selectedWeek)
      ? "week-button active"
      : "week-button";

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
