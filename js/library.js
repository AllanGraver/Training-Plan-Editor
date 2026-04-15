"use strict";

/* =========================================================
   LOCAL STORAGE – PLAN BIBLIOTEK
   ========================================================= */

function loadLibrary() {
  const raw = localStorage.getItem("training_plans_library");
  return raw ? JSON.parse(raw) : {};
}

function saveLibrary(lib) {
  localStorage.setItem("training_plans_library", JSON.stringify(lib));
}

/* =========================================================
   RENDER PLAN-BIBLIOTEK (SIDEBAR)
   ========================================================= */

function renderLibrary() {
  const lib = loadLibrary();
  const div = document.getElementById("planLibrary");
  div.innerHTML = "";

  Object.keys(lib).forEach(name => {
    const item = document.createElement("div");
    item.className = "plan-item";
    item.textContent = name;

    // ⭐ Markér valgt plan
    if (plan && plan.plan_name === name) {
      item.classList.add("selected");
    }

    item.onclick = () => loadPlan(name);
    div.appendChild(item);
  });
}

/* =========================================================
   OPRET NY PLAN
   ========================================================= */

function newPlan() {
  const name = prompt("Navn på den nye plan:");
  if (!name) return;

  plan = {
    plan_name: name,
    duration_weeks: 12,
    race_distance_km: null,
    sessions: []
  };

  const lib = loadLibrary();
  lib[name] = plan;
  saveLibrary(lib);

  selectedWeek = 1;
  selectedSessionIndex = null;

  renderLibrary();
  renderMain();
  renderEditor();
}

/* =========================================================
   GEM PLAN
   ========================================================= */

function savePlan() {
  const name = plan.plan_name || prompt("Navn på planen:");
  if (!name) return;

  plan.plan_name = name;

  const lib = loadLibrary();
  lib[name] = plan;
  saveLibrary(lib);
  renderLibrary();
}

/* =========================================================
   GEM SOM (tidl. GEM SOM NY)
   ========================================================= */

function savePlanAs() {
  const name = prompt("Navn på ny plan:");
  if (!name) return;

  plan.plan_name = name;

  const lib = loadLibrary();
  lib[name] = plan;
  saveLibrary(lib);
  renderLibrary();
}

/* =========================================================
   INDLÆS PLAN
   ========================================================= */

function loadPlan(name) {
  const lib = loadLibrary();
  plan = JSON.parse(JSON.stringify(lib[name]));

  // Sikr at sessions har steps-array
  plan.sessions.forEach(s => {
    if (!Array.isArray(s.steps)) s.steps = [];
  });

  selectedWeek = 1;
  selectedSessionIndex = null;

  renderLibrary();
  renderMain();
  renderEditor();
}

/* =========================================================
   EKSPORT / IMPORT
   ========================================================= */

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

      // ⭐ Brug filnavnet som planens navn
      const fileName = file.name.replace(/\.json$/i, "");
      imported.plan_name = fileName;

      // Sikr steps-array
      imported.sessions.forEach(s => {
        if (!Array.isArray(s.steps)) s.steps = [];
      });

      plan = imported;

      const lib = loadLibrary();
      lib[fileName] = plan;
      saveLibrary(lib);

      renderLibrary();
      renderMain();
      renderEditor();
    };

    reader.readAsText(file);
  };

  input.click();
}

/* =========================================================
   EKSPORTER FUNKTIONER
   ========================================================= */

window.renderLibrary = renderLibrary;
window.newPlan = newPlan;
window.savePlan = savePlan;
window.savePlanAs = savePlanAs;
window.loadPlan = loadPlan;
window.exportPlan = exportPlan;
window.importPlan = importPlan;
