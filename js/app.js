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
