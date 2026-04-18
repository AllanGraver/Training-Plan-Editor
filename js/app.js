"use strict";
/* =========================================================
   FILE: app.js
   PURPOSE:
   - Global state (plan, selectedWeek, selectedSessionIndex)
   - Tema (dark/light) + localStorage
   - Init goals panel (race date + duration weeks)
   - Init app (load library, render UI)
   ========================================================= */

let plan = {
  plan_name: "Ny plan",
  duration_weeks: 12,     // ✅ default 12
  race_date: null,        // ✅ gemmes som "yyyy-mm-dd"
  race_distance_km: null,
  sessions: []
};

let selectedWeek = 1;
let selectedSessionIndex = null;

/* ============================
   SMALL HELPERS
   ============================ */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function ensurePlanDefaults() {
  // Sikr at plan altid har forventede felter
  plan.plan_name = plan.plan_name || "Ny plan";

  const dw = Number(plan.duration_weeks);
  plan.duration_weeks = clamp(dw || 12, 1, 36); // ✅ 1..36, default 12

  if (!Array.isArray(plan.sessions)) plan.sessions = [];
  if (typeof plan.race_date === "undefined") plan.race_date = null;

  selectedWeek = clamp(Number(selectedWeek) || 1, 1, plan.duration_weeks);
  if (selectedSessionIndex === undefined) selectedSessionIndex = null;
}

/* ============================
   THEME (DARK / LIGHT)
   ============================ */

function applyThemeLabel() {
  const isDark = document.body.classList.contains("dark-mode");
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = isDark ? "Light mode" : "Dark mode";
}

function initThemeToggle() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  // gendan theme
  const saved = localStorage.getItem("tp_theme");
  if (saved === "dark") document.body.classList.add("dark-mode");

  applyThemeLabel();

  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem(
      "tp_theme",
      document.body.classList.contains("dark-mode") ? "dark" : "light"
    );
    applyThemeLabel();
  });
}

/* ============================
   GOALS PANEL (race date + weeks)
   ============================ */

function setDurationWeeks(newCount) {
  const count = Math.max(1, Math.min(36, Number(newCount) || 12));
  plan.duration_weeks = count;

  // clamp selectedWeek ind i range
  if (selectedWeek > count) selectedWeek = count;

  // ✅ SLET sessions der ligger udenfor range (som du bad om: oprette/slette uger)
  plan.sessions = plan.sessions.filter(s => (s.week || 1) <= count);

  selectedSessionIndex = null;

  if (typeof renderWeeks === "function") renderWeeks();
  if (typeof renderMain === "function") renderMain();
  if (typeof renderEditor === "function") renderEditor();
}

function initGoalsPanel() {
  ensurePlanDefaults();

  const dateInput = document.getElementById("raceDateInput");
  const weeksSelect = document.getElementById("weeksCountSelect");
  if (!weeksSelect) return;

  // Fyld dropdown 1..36
  weeksSelect.innerHTML = "";
  for (let i = 1; i <= 36; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = String(i);
    weeksSelect.appendChild(opt);
  }

  // Default 12 hvis ikke sat
  if (!plan.duration_weeks || Number(plan.duration_weeks) < 1) {
    plan.duration_weeks = 12;
  }
  
  // Sæt dropdown til planens værdi
  weeksSelect.value = String(plan.duration_weeks);
  
  // Race date (valgfrit)
  if (dateInput) {
    dateInput.value = plan.race_date || "";
    dateInput.addEventListener("change", () => {
      plan.race_date = dateInput.value || null;
      if (typeof renderWeeks === "function") renderWeeks(); // senere kan vi regenere labels
    });
  }

  // Når antal uger ændres: opret/slet automatisk
  weeksSelect.addEventListener("change", () => {
    setDurationWeeks(weeksSelect.value);
  });
}

/* ============================
   HELPERS TIL SESSIONS (bruges stadig af andre filer)
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
  ensurePlanDefaults();

  // Theme
  initThemeToggle();

  // Library load: vælg første plan hvis findes
  if (typeof loadLibrary === "function") {
    const lib = loadLibrary();
    const names = Object.keys(lib);

    if (names.length > 0) {
      plan = JSON.parse(JSON.stringify(lib[names[0]]));
      ensurePlanDefaults();
    }
  }

  // Sikr steps-array
  plan.sessions.forEach(s => {
    if (!Array.isArray(s.steps)) s.steps = [];
  });

  // Default selection
  selectedWeek = clamp(selectedWeek, 1, plan.duration_weeks);
  selectedSessionIndex = null;

  // Init goals panel (fylder dropdown + binder events)
  initGoalsPanel();

  // Render UI
  if (typeof renderLibrary === "function") renderLibrary();
  if (typeof renderWeeks === "function") renderWeeks();
  if (typeof renderMain === "function") renderMain();
  if (typeof renderEditor === "function") renderEditor();
}

/* ============================
   WINDOW EXPORTS
   ============================ */

window.initApp = initApp;
window.getSessionsForWeek = getSessionsForWeek;
window.getCurrentSession = getCurrentSession;
window.setDurationWeeks = setDurationWeeks; // hvis du vil bruge den andre steder

window.addEventListener("DOMContentLoaded", initApp);
