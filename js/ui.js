
"use strict";

/* =========================================================
   UI STATE
========================================================= */
let editorMode = "overview"; // "overview" | "step"
let activeStepIndex = null;

/* =========================================================
   HELPERS
========================================================= */
function ensureSessionSteps(session) {
  if (!Array.isArray(session.steps) || session.steps.length === 0) {
    session.steps = [
      {
        id: "warmup",
        type: "Opvarmning",
        duration: { type: "lap", value: null },
        intensity: { type: "none", value: null },
        note: ""
      },
      {
        id: "run",
        type: "Løb",
        duration: { type: "distance", value: 0.01 },
        intensity: { type: "tempo", value: "5:30–6:00 /km" },
        note: ""
      },
      {
        id: "cooldown",
        type: "Nedkøling",
        duration: { type: "lap", value: null },
        intensity: { type: "none", value: null },
        note: ""
      }
    ];
  }
}

function getCurrentSession() {
  if (selectedSessionIndex == null) return null;
  return plan.sessions.filter(s => s.week === selectedWeek)[selectedSessionIndex] || null;
}


/* =========================================================
   MIDTERPANEL DISPATCHER
========================================================= */
function renderMain() {
  if (editorMode === "overview") {
    renderRunOverview();
  } else if (editorMode === "step") {
    renderStepEditor();
  }
}





/* =========================================================
   ÅBN TRIN
========================================================= */
function openStep(index) {
  activeStepIndex = index;
  editorMode = "step";
  renderMain();
}

/* =========================================================
   TRIN EDITOR (Opvarmning / Løb / Nedkøling)
========================================================= */
function renderStepEditor() {
  const main = document.getElementById("main");
  main.innerHTML = "";

  const session = getCurrentSession();
  ensureSessionSteps(session);

  const step = session.steps[activeStepIndex];

  const card = document.createElement("div");
  card.className = "week-card";

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button onclick="backToOverview()">←</button>
      <h2>${step.type}</h2>
      <button onclick="removeStep()">Fjern</button>
    </div>

    <h4>TRINOPLYSNINGER</h4>
    <label>Trintype</label>
    <div>${step.type}</div>

    <label>Tilføj noter</label>
    <textarea id="stepNote">${step.note || ""}</textarea>

    <h4>VARIGHED</h4>
    <label>Varighedstype</label>
    <div>${step.duration.type === "lap" ? "Tryk på knappen Lap" : "Distance"}</div>

    <label>Varighed</label>
    <div>${step.duration.value ?? "---"}</div>

    <h4>INTENSITETSMÅL</h4>
    <label>Måltype</label>
    <div>${step.intensity.type === "none" ? "Intet mål" : "Tempo"}</div>

    ${
      step.intensity.type !== "none"
        ? `<div>Mål: ${step.intensity.value}</div>`
        : ""
    }
  `;

  main.appendChild(card);

  // live note sync
  const noteEl = document.getElementById("stepNote");
  if (noteEl) {
    noteEl.addEventListener("input", () => {
      step.note = noteEl.value;
    });
  }
}

/* =========================================================
   TILBAGE
========================================================= */
function backToOverview() {
  editorMode = "overview";
  activeStepIndex = null;
  renderMain();
}

/* =========================================================
   FJERN TRIN (placeholder)
========================================================= */
function removeStep() {
  alert("Fjern trin – logik kommer senere");
}

/* =========================================================
   EKSPORT
========================================================= */
window.renderMain = renderMain;
