
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
