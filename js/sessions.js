"use strict";
/* =========================================================
   FILE: sessions.js
   PURPOSE:
   - Håndterer træningspas (sessions) i en uge
   - Viser ugens pas i midterpanelet (renderMain)
   - Tilføjer nye træningspas (addSession)
   - Vælger hvilket pas der er aktivt (selectSession)
   ========================================================= */

/* ============================
   TILFØJ TRÆNINGSPAS
   ============================ */

function addSession() {
  const sessionsThisWeek = getSessionsForWeek(selectedWeek);

  const newSession = {
    id: Date.now(),
    week: selectedWeek,
    name: `Træningpas ${sessionsThisWeek.length + 1}`,
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

  // Tilføj pas til planen
  plan.sessions.push(newSession);

  // ❗ VIGTIGT: Vi vælger IKKE automatisk det nye pas
  // selectedSessionIndex = sessions.length - 1;  <-- fjernet

  // Opdater UI
  renderMain();     // viser det nye pas i midterpanelet
  renderEditor();   // højre panel viser "Vælg et pas…"
}

/* ============================
   RENDER MAIN (UGENS PAS)
   ============================ */

function stepTitle(step) {
  switch (step.type) {
    case "warmup": return "Opvarmning";
    case "run": return "Løb";
    case "recovery": return "Restitution";
    case "rest": return "Hvile";
    case "cooldown": return "Nedkøling";
    case "other": return "Andet";
    default: return "Trin";
  }
}

function stepSubtitle(step) {
  let parts = [];

  if (step.type === "run" && step.mode === "interval") {
    parts.push("Intervaller");
  } else {
    if (step.durationType === "time") {
      const h = step.hours || 0;
      const m = step.minutes || 0;
      const s = step.seconds || 0;
      const timeStr = [
        h ? `${h}t` : "",
        m ? `${m}m` : "",
        s ? `${s}s` : ""
      ].filter(Boolean).join(" ");
      if (timeStr) parts.push(timeStr);
    } else if (step.durationType === "distance") {
      if (step.distance) parts.push(`${step.distance} km`);
    }
  }

  if (step.intensity) {
    parts.push(`Intensitet: ${step.intensity}`);
  }

  if (step.notes) {
    parts.push(step.notes);
  }

  return parts.join(" • ");
}

function renderStepCard(step, index) {
  const colors = {
    warmup: "#fc4c02",
    run: "#007aff",
    cooldown: "#2ecc71",
    recovery: "#16a085",
    rest: "#9b59b6",
    other: "#bdc3c7"
  };

  const color = colors[step.type] || "#ffffff";

  return `
    <div class="step-card" style="border-left: 6px solid ${color};" onclick="editStep(${index})">

      <div class="step-card-header">
        <div class="step-title">${stepTitle(step)}</div>

        <div class="step-actions" onclick="event.stopPropagation()">

          <span class="step-action-btn" onclick="moveStepUp(${index})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round"
                 stroke-linejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </span>

          <span class="step-action-btn" onclick="moveStepDown(${index})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round"
                 stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>

          <span class="step-action-btn delete" onclick="deleteStep(${index})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round"
                 stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14H6L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
              <path d="M9 6V4h6v2"></path>
            </svg>
          </span>

        </div>
      </div>

      <div class="step-sub">${stepSubtitle(step)}</div>
    </div>
  `;
}

function renderMain() {
  const main = document.getElementById("main");
  if (!main) return;

  const sessions = getSessionsForWeek(selectedWeek);

  if (sessions.length === 0) {
    main.innerHTML = "<p>Ingen træningspas i denne uge endnu.</p>";
    return;
  }

  let html = "";

  sessions.forEach((session, idx) => {
    const isSelected = idx === selectedSessionIndex;
    html += `
      <div class="session-card ${isSelected ? "selected" : ""}" onclick="selectSession(${idx})">
        <div class="session-header">
          <div class="session-title">${session.name || "Pas"}</div>
        </div>
        <div class="session-steps">
          ${session.steps.map((step, sIdx) => renderStepCard(step, sIdx)).join("")}
        </div>
      </div>
    `;
  });

  main.innerHTML = html;
}

/* ============================
   VÆLG TRÆNINGSPAS
   ============================ */

function selectSession(index) {
  selectedSessionIndex = index;
  renderMain();
  renderEditor();
}

/* ============================
   WINDOW EXPORTS
   ============================ */

window.addSession = addSession;
window.renderMain = renderMain;
window.selectSession = selectSession;
