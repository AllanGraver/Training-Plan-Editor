"use strict";
/* =========================================================
   FILE: library.js
   PURPOSE:
   - Håndterer plan-bibliotek i localStorage
   - Opret, gem, gem som, indlæs, import/eksport planer
   - Renderer plan-listen i venstre sidebar
   ========================================================= */

/* ============================
   LOCAL STORAGE
   ============================ */

function loadLibrary() {
  const raw = localStorage.getItem("training_plans_library");
  return raw ? JSON.parse(raw) : {};
}

function saveLibrary(lib) {
  localStorage.setItem("training_plans_library", JSON.stringify(lib));
}

/* ============================
   RENDER PLAN-LISTE
   ============================ */

function renderLibrary() {
  const lib = loadLibrary();
  const div = document.getElementById("planList");
  if (!div) return;

  div.innerHTML = "";

  Object.keys(lib).forEach(name => {
    const row = document.createElement("div");
    row.className = "plan-item-row";

    const item = document.createElement("div");
    item.className = "plan-item";
    item.textContent = name;

    if (plan && plan.plan_name === name) {
      item.classList.add("selected");
    }

    item.onclick = () => loadPlan(name);

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
      e.stopPropagation();
      if (confirm(`Slet planen "${name}"?`)) {
        delete lib[name];
        saveLibrary(lib);

        if (plan.plan_name === name) {
          plan = {
            plan_name: "Ny plan",
            duration_weeks: 12,
            race_distance_km: null,
            sessions: []
          };
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
    div.appendChild(row);
  });
}

/* ============================
   OPRET NY PLAN
   ============================ */

function newPlan() {
  const name = prompt("Navn på den nye træningsplan:");
  if (!name) return;

  // Ny plan med 1 uge og 1 standard-pas i uge 1
  const firstSession = {
    id: Date.now(),
    week: 1,
    name: "Pas 1",
    steps: [
      {
        type: "warmup",
        durationType: "time",
        hours: 0,
        minutes: 5,
        seconds: 0,
        notes: "",
        intensity: "E"
      },
      {
        type: "run",
        mode: "simple",
        durationType: "distance",
        distance: 1,
        notes: "",
        intensity: "T"
      },
      {
        type: "cooldown",
        durationType: "time",
        hours: 0,
        minutes: 5,
        seconds: 0,
        notes: "",
        intensity: "E"
      }
    ]
  };

  plan = {
    plan_name: name,
    duration_weeks: 12,
    race_distance_km: null,
    sessions: [firstSession]
  };

  const lib = loadLibrary();
  lib[name] = plan;
  saveLibrary(lib);

  selectedWeek = 1;
  selectedSessionIndex = 0;

  renderLibrary();
  renderWeeks();
  renderMain();
  renderEditor();
}

/* ============================
   GEM PLAN
   ============================ */

function savePlan() {
  const name = plan.plan_name || prompt("Navn på træningsplanen:");
  if (!name) return;

  plan.plan_name = name;

  const lib = loadLibrary();
  lib[name] = plan;
  saveLibrary(lib);

  renderLibrary();
}

/* ============================
   GEM SOM
   ============================ */

function savePlanAs() {
  const name = prompt("Navn på ny træningsplan:");
  if (!name) return;

  plan.plan_name = name;

  const lib = loadLibrary();
  lib[name] = plan;
  saveLibrary(lib);

  loadPlan(name);
}

/* ============================
   INDLÆS PLAN
   ============================ */

function loadPlan(name) {
  const lib = loadLibrary();
  plan = JSON.parse(JSON.stringify(lib[name]));

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

/* ============================
   EKSPORT / IMPORT
   ============================ */

function exportPlan() {
  const data = JSON.stringify(plan, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = plan.plan_name + ".json";
  a.click();
}

function importPlan() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const imported = JSON.parse(reader.result);
      const fileName = file.name.replace(/\.json$/i, "");
      imported.plan_name = fileName;

      imported.sessions.forEach(s => {
        if (!Array.isArray(s.steps)) s.steps = [];
      });

      const lib = loadLibrary();
      lib[fileName] = imported;
      saveLibrary(lib);

      loadPlan(fileName);
    };

    reader.readAsText(file);
  };

  input.click();
}

/* ============================
   WINDOW EXPORTS
   ============================ */

window.renderLibrary = renderLibrary;
window.newPlan = newPlan;
window.savePlan = savePlan;
window.savePlanAs = savePlanAs;
window.loadPlan = loadPlan;
window.exportPlan = exportPlan;
window.importPlan = importPlan;
window.loadLibrary = loadLibrary;
window.saveLibrary = saveLibrary;
