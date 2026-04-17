"use strict";
/* =========================================================
   FILE: sessions.js
   PURPOSE:
   - Håndterer træningspas (sessions) i en uge
   - Viser ugens pas i midterpanelet (renderMain)
   - Tilføjer nye træningspas (addSession)
   - Ugedag vælges i midterpanelet
   - Tilføj trin / tilføj interval-blok
   ========================================================= */


/* ============================
   TILFØJ TRÆNINGSPAS
   ============================ */

function addSession() {
  const newSession = {
    id: Date.now(),
    week: selectedWeek,
    name: "Træningspas",
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

  plan.sessions.push(newSession);

  renderMain();
  renderEditor();
}


/* ============================
   HJÆLPER: SESSIONS FOR UGE
   ============================ */

function getSessionsForWeek(week) {
  return plan.sessions.filter(s => s.week === week);
}

function getCurrentSession() {
  const sessions = getSessionsForWeek(selectedWeek);
  return sessions[selectedSessionIndex] || null;
}

function deleteSession(index) {
  const sessions = getSessionsForWeek(selectedWeek);
  const sessionToDelete = sessions[index];
  if (!sessionToDelete) return;

  plan.sessions = plan.sessions.filter(s => s.id !== sessionToDelete.id);

  selectedSessionIndex = 0;
  renderMain();
  renderEditor();
}


/* ============================
   OPDATER UGEDAG
   ============================ */

function updateSessionDay(index, day) {
  const sessions = getSessionsForWeek(selectedWeek);
  const session = sessions[index];
  if (!session) return;

  session.day = day;

  renderMain();
  renderEditor();
}


/* ============================
   HJÆLPER: INDSÆT FØR NEDKØLING
   ============================ */

function insertBeforeCooldown(session, steps) {
  const idx = session.steps.findIndex(s => s.type === "cooldown");
  const insertIndex = idx === -1 ? session.steps.length : idx;
  session.steps.splice(insertIndex, 0, ...steps);
}


/* ============================
   TILFØJ ENKELT TRIN
   ============================ */

function addSingleStepToSession(sessionIndex) {
  const sessions = getSessionsForWeek(selectedWeek);
  const session = sessions[sessionIndex];
  if (!session) return;

  const newStep = {
    type: "run",
    durationType: "time",
    hours: 0,
    minutes: 5,
    seconds: 0,
    intensity: "E",
    notes: ""
  };

  insertBeforeCooldown(session, [newStep]);

  renderMain();
  renderEditor();
}


/* ============================
   TILFØJ INTERVAL-BLOK (2 TRIN)
   ============================ */

function addIntervalToSession(sessionIndex) {
  const sessions = getSessionsForWeek(selectedWeek);
  const session = sessions[sessionIndex];
  if (!session) return;

  const blockId = Date.now();

  const intervalBlock = [
    {
      type: "run",
      durationType: "time",
      hours: 0,
      minutes: 2,
      seconds: 0,
      intensity: "I",
      notes: "Hurtigt",
      blockId,
      blockReps: 2, // ✅ default 2 gange
      blockAnchor: true,      // ✅ nyt
      blockRole: "work"       // ✅ nyt
    },
    {
      type: "recovery",
      durationType: "time",
      hours: 0,
      minutes: 1,
      seconds: 0,
      intensity: "E",
      notes: "Roligt",
      blockId,
      blockReps: 2, // ✅ default 2 gange
      blockAnchor: true,      // ✅ nyt
      blockRole: "recovery"   // ✅ ny
    }
  ];

  insertBeforeCooldown(session, intervalBlock);

  renderMain();
  renderEditor();
}


/* ============================
   STEP TITLER OG SUBTITLER
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
  }

  if (step.durationType === "distance" && step.distance) {
    parts.push(`${step.distance} km`);
  }

  if (step.intensity) {
    parts.push(`Intensitet: ${step.intensity}`);
  }

  if (step.notes) {
    parts.push(step.notes);
  }

  return parts.join(" • ");
}


/* ============================
   RENDER STEP CARD
   ============================ */

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

          <span class="step-action-btn" onclick="moveStepUp(${index})">▲</span>
          <span class="step-action-btn" onclick="moveStepDown(${index})">▼</span>
          <span class="step-action-btn delete" onclick="deleteStep(${index})">🗑</span>

        </div>
      </div>

      <div class="step-sub">${stepSubtitle(step)}</div>
    </div>
  `;
}


/* ============================
   RENDER MAIN (UGENS PAS)
   ============================ */
function renderStepsWithBlocks(session) {
  let html = "";
  const steps = session.steps || [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    // Normal step uden block
    if (!step.blockId) {
      html += renderStepCard(step, i);
      continue;
    }

    // Start på en block: saml alle efterfølgende steps med samme blockId
    const blockId = step.blockId;
    const blockSteps = [];
    let j = i;

    while (j < steps.length && steps[j].blockId === blockId) {
      blockSteps.push({ step: steps[j], index: j });
      j++;
    }

    // reps: tag fra første step, fallback 2
    const reps = Number(blockSteps[0].step.blockReps ?? 2);

    // Dropdown values (tilpas efter behov)
    const repOptions = [1,2,3,4,5,6,8,10,12,15,20];

    html += `
      <div class="interval-block"
           style="
             border: 2px dashed #ff6b00;
             border-radius: 12px;
             padding: 10px;
             margin: 10px 0;
             background: #fff8f2;
           "
      >
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px;">
          <div style="font-weight:700;">Interval: </div>

          <div style="display:flex; align-items:center; gap:8px;">
            <select
              onchange="updateIntervalBlockReps(${blockId}, this.value); event.stopPropagation();"
              onclick="event.stopPropagation();"
              style="padding:4px 8px; border-radius:10px;"
            >
              ${repOptions.map(n => `<option value="${n}" ${n === reps ? "selected" : ""}>${n} gange</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="interval-block-steps" style="display:flex; flex-direction:column; gap:8px;">
          ${blockSteps.map(bs => renderStepCard(bs.step, bs.index)).join("")}
        </div>
      </div>
    `;

    // spring i frem til efter blokken
    i = j - 1;
  }

  return html;
}

function renderMain() {
  const main = document.getElementById("main");
  if (!main) return;

  const sessions = getSessionsForWeek(selectedWeek);

  if (sessions.length === 0) {
    main.innerHTML = "<p>Ingen træningspas i denne uge endnu.</p>";
    document.getElementById("mainTitle").textContent = "Træningspas";
    return;
  }

  let html = "";

  sessions.forEach((session, idx) => {
    const isSelected = idx === selectedSessionIndex;

    html += `
      <div class="session-card ${isSelected ? "selected" : ""}" onclick="selectSession(${idx})">

        <div class="session-header">
          <div class="session-title">Træningspas ${idx + 1}:</div>

          <select class="session-day-select"
                  onclick="event.stopPropagation()"
                  onmousedown="event.stopPropagation()"
                  onchange="updateSessionDay(${idx}, this.value); event.stopPropagation();">
            ${["Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag","Søndag"]
              .map(d => `<option value="${d}" ${d === session.day ? "selected" : ""}>${d}</option>`)
              .join("")}
          </select>
        </div>

        <div class="session-steps">
          ${renderStepsWithBlocks(session)}
        </div>

        <div class="session-actions" onclick="event.stopPropagation();">
          <button onclick="addSingleStepToSession(${idx});">Tilføj trin</button>
          <button onclick="addIntervalToSession(${idx});">Tilføj interval</button>
        </div>

      </div>
    `;
  });

  main.innerHTML = html;

  const current = sessions[selectedSessionIndex];
  if (current) {
    document.getElementById("mainTitle").textContent = "Træningspas";
  }
}


/* ============================
   VÆLG TRÆNINGSPAS
   ============================ */

function selectSession(index) {
  selectedSessionIndex = index;
  renderMain();
  renderEditor();
}





function updateIntervalBlockReps(blockId, reps) {
  const session = getCurrentSession();
  if (!session) return;

  session.steps.forEach(step => {
    if (step.blockId === blockId) {
      step.blockReps = Number(reps);
    }
  });

   
// ✅ sikrer at alle trin i range får samme reps
  recomputeIntervalBlocks(session);

  renderMain();
  renderEditor();
}



function recomputeIntervalBlocks(session) {
  if (!session || !session.steps) return;

  const steps = session.steps;

  // 1) Find alle blockId’er der har anchors
  const anchorIds = new Set(
    steps
      .filter(s => s.blockAnchor && s.blockId)
      .map(s => s.blockId)
  );

  // Markér hvilke index der ender som "inde i en blok"
  const inAnyBlock = new Array(steps.length).fill(false);

  // 2) For hver blok: find work/recovery anchor og definér range
  anchorIds.forEach(id => {
    const workIndex = steps.findIndex(s =>
      s.blockAnchor && s.blockId === id && s.blockRole === "work"
    );
    const recIndex = steps.findIndex(s =>
      s.blockAnchor && s.blockId === id && s.blockRole === "recovery"
    );

    // Hvis noget mangler: ryd løse medlemmer (failsafe)
    if (workIndex === -1 || recIndex === -1) {
      steps.forEach(s => {
        if (!s.blockAnchor && s.blockId === id) {
          delete s.blockId;
          delete s.blockReps;
        }
      });
      return;
    }

    const start = Math.min(workIndex, recIndex);
    const end = Math.max(workIndex, recIndex);

    // Reps tages fra work anchor
    const reps = Number(steps[workIndex].blockReps ?? 2);

    // 3) Alle trin i start..end er en del af blokken
    for (let i = start; i <= end; i++) {
      steps[i].blockId = id;
      steps[i].blockReps = reps;
      inAnyBlock[i] = true;
    }
  });

  // 4) Trin udenfor alle blokke mister blockId (medmindre de er anchors)
  for (let i = 0; i < steps.length; i++) {
    if (!inAnyBlock[i] && !steps[i].blockAnchor && steps[i].blockId) {
      delete steps[i].blockId;
      delete steps[i].blockReps;
    }
  }
}
``

/* ============================
   WINDOW EXPORTS
   ============================ */

window.addSession = addSession;
window.renderMain = renderMain;
window.selectSession = selectSession;
window.updateSessionDay = updateSessionDay;
window.addSingleStepToSession = addSingleStepToSession;
window.addIntervalToSession = addIntervalToSession;
window.getSessionsForWeek = getSessionsForWeek;
window.getCurrentSession = getCurrentSession;
window.deleteSession = deleteSession;
window.updateIntervalBlockReps = updateIntervalBlockReps;
window.recomputeIntervalBlocks = recomputeIntervalBlocks;
