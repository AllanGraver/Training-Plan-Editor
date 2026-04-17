"use strict";
/* =========================================================
   FILE: app.js
   PURPOSE:
   - Global state (plan, selectedWeek, selectedSessionIndex)
   - Tema (dark/light) og initApp()
   - Fælles helpers: getSessionsForWeek, getCurrentSession
   ========================================================= */

let plan = {
  plan_name: "Ny plan",
  duration_weeks: 12,
  race_distance_km: null,
  sessions: []
};

let selectedWeek = 1;
let selectedSessionIndex = null;

/* ============================
   TEMA (DARK / LIGHT MODE)
   ============================ */

function applyTheme() {
  const isDark = document.body.classList.contains("dark-mode");
  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.textContent = isDark ? "Light mode" : "Dark mode";
  }
}

/* ============================
   HELPERS TIL SESSIONS
   ============================ */

function getSessionsForWeek(week) {
  return plan.sessions.filter(s => s.week === week);
}

function getCurrentSession() {
  const sessions = getSessionsForWeek(selectedWeek);
  if (
    selectedSessionIndex == null ||
    selectedSessionIndex < 0 ||
    selectedSessionIndex >= sessions.length
  ) {
    return null;
  }
  return sessions[selectedSessionIndex];
}

/* ============================
   INIT APP
   ============================ */

function initApp() {
  // Tema-knap
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.onclick = () => {
      document.body.classList.toggle("dark-mode");
      applyTheme();
    };
    applyTheme();
  }

  // Hvis der findes planer i library → load første
  const lib = loadLibrary();
  const names = Object.keys(lib);

  if (names.length > 0) {
    plan = JSON.parse(JSON.stringify(lib[names[0]]));
  }

  // Sikr steps-array
  plan.sessions.forEach(s => {
    if (!Array.isArray(s.steps)) s.steps = [];
  });

  // Hvis planen er tom → ingen sessions endnu
  selectedWeek = 1;
  selectedSessionIndex = null;

  renderLibrary();
  renderWeeks();
  renderMain();
  renderEditor();
}

/* ============================
   WINDOW EXPORTS
   ============================ */

window.initApp = initApp;
window.getSessionsForWeek = getSessionsForWeek;
window.getCurrentSession = getCurrentSession;


window.addEventListener("DOMContentLoaded", () => {
  if (window.renderLibrary) renderLibrary();
  if (window.renderWeeks) renderWeeks();
  if (window.renderMain) renderMain();
  if (window.renderEditor) renderEditor();
});


window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  // Gendan theme fra localStorage (valgfrit men lækkert)
  const saved = localStorage.getItem("tp_theme");
  if (saved === "dark") document.body.classList.add("dark-mode");

  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("tp_theme",
      document.body.classList.contains("dark-mode") ? "dark" : "light"
    );
  });
});

function initGoalsPanel() {
  const dateInput = document.getElementById("raceDateInput");
  const weeksSelect = document.getElementById("weeksCountSelect");
  if (!dateInput || !weeksSelect) return;

  // Sørg for plan findes
  window.plan = window.plan || {
    plan_name: "Ny plan",
    duration_weeks: 1,
    race_distance_km: null,
    sessions: []
  };

  // 1) Fyld dropdown med antal uger (1..24)
  weeksSelect.innerHTML = "";
  for (let i = 1; i <= 24; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = String(i);
    weeksSelect.appendChild(opt);
  }

  // 2) Sæt standardværdier (default 1 uge)
  const currentWeeks = Number(plan.duration_weeks || 1);
  weeksSelect.value = String(currentWeeks);

  // 3) Sæt konkurrencedato hvis den findes (vi gemmer som ISO: yyyy-mm-dd)
  if (plan.race_date) {
    dateInput.value = plan.race_date;
  } else {
    dateInput.value = ""; // ingen valgt
  }

  // 4) Event handlers
  dateInput.addEventListener("change", () => {
    plan.race_date = dateInput.value || null; // "yyyy-mm-dd" eller null
    // her kan vi senere regenere uge-labels ud fra race_date
    if (typeof renderWeeks === "function") renderWeeks();
  });

  weeksSelect.addEventListener("change", () => {
    plan.duration_weeks = Number(weeksSelect.value) || 1;

    // hvis du vil: autogenerér uger (se note nedenfor)
    if (typeof renderWeeks === "function") renderWeeks();
  });
}

// Kør ved load
window.addEventListener("DOMContentLoaded", () => {
  initGoalsPanel();
});
