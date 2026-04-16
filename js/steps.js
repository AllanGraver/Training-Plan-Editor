"use strict";
/* =========================================================
   FILE: steps.js
   PURPOSE:
   - Højre panel: editor for trin (steps)
   - Redigering af ugedag, type, noter, varighed, intensitet
   - Run-mode toggle (simpelt / intervaller)
   - Flyt/slet/tilføj trin + JSON preview
   ========================================================= */


/* ============================
   RENDER EDITOR PANEL
   ============================ */

function renderEditor() {
  const editor = document.getElementById("sessionEditor");
  const session = getCurrentSession();

  if (!editor) return;

  if (!session) {
    editor.innerHTML = "Vælg et pas…";
    updateJsonPreview(null);
    return;
  }

  if (session.steps.length > 0) {
    editStep(0);
  } else {
    editor.innerHTML = "<p>Ingen trin endnu.</p>";
    updateJsonPreview(session);
  }
}


/* ============================
   EDIT STEP (med kompakt ugedag)
   ============================ */

function editStep(index) {
  const session = getCurrentSession();
  if (!session) return;

  const step = session.steps[index];
  const editor = document.getElementById("sessionEditor");
  if (!editor) return;

  const currentDay = session.day || "Mandag";

  editor.innerHTML = `
    <h3>Træningspas</h3>

    <label>Ugedag</label>
    <select class="compact-day-select"
            onchange="updateSessionField('day', this.value)">
      ${["Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag","Søndag"]
        .map(d => `<option value="${d}" ${d === currentDay ? "selected" : ""}>${d}</option>`)
        .join("")}
    </select>

    <h3>Trinoplysninger</h3>

    <label>Trintype</label>
    <select onchange="updateStep(${index}, 'type', this.value)">
      <option value="warmup" ${step.type === "warmup" ? "selected" : ""}>Opvarmning</option>
      <option value="run" ${step.type === "run" ? "selected" : ""}>Løb</option>
      <option value="recovery" ${step.type === "recovery" ? "selected" : ""}>Restitution</option>
      <option value="rest" ${step.type === "rest" ? "selected" : ""}>Hvile</option>
      <option value="cooldown" ${step.type === "cooldown" ? "selected" : ""}>Nedkøling</option>
      <option value="other" ${step.type === "other" ? "selected" : ""}>Andet</option>
    </select>

    <label>Noter</label>
    <textarea onchange="updateStep(${index}, 'notes', this.value)">${step.notes || ""}</textarea>

    ${step.type === "run" ? renderRunModeToggle(step, index) : ""}

    ${
      step.type === "run" && step.mode === "interval"
        ? renderIntervalEditorButton(index)
        : renderDurationFields(step, index)
    }

    ${
      step.type === "run" && step.mode === "interval"
        ? ""
        : renderIntensityField(step, index)
    }
  `;

  updateJsonPreview(session);
}


/* ============================
   OPDATERING AF PAS-FELTER (kun ugedag)
   ============================ */

function updateSessionField(key, value) {
  const session = getCurrentSession();
  if (!session) return;

  session[key] = value;

  renderMain();
  renderEditor();
}


/* ============================
   RUN MODE TOGGLE
   ============================ */

function renderRunModeToggle(step, index) {
  return `
    <h3>Løbetype</h3>
    <div class="toggle-container">
      <div class="toggle-track" onclick="toggleRunMode(${index})">
        <div class="toggle-thumb ${step.mode === "interval" ? "right" : "left"}"></div>
      </div>
      <div class="toggle-labels">
        <span class="${step.mode === "simple" ? "active" : ""}">Simpelt</span>
        <span class="${step.mode === "interval" ? "active" : ""}">Intervaller</span>
      </div>
    </div>
  `;
}

function toggleRunMode(index) {
  const session = getCurrentSession();
  if (!session) return;

  const step = session.steps[index];

  if (step.mode === "simple") {
    step.mode = "interval";
    step.segments = [
      {
        repetitions: 3,
        steps: [
          { duration_min: 2, note: "Hurtigt" },
          { duration_min: 1, note: "Roligt" }
        ]
      }
    ];
  } else {
    step.mode = "simple";
    delete step.segments;
    step.durationType = "time";
    step.hours = 0;
    step.minutes = 20;
    step.seconds = 0;
  }

  renderMain();
  editStep(index);
}


/* ============================
   INTERVAL EDITOR BUTTON
   ============================ */

function renderIntervalEditorButton(index) {
  return `
    <h3>Intervaller</h3>
    <button onclick="editSegments(${index})">Rediger intervaller</button>
  `;
}


/* ============================
   VARIGHEDSFELTER
   ============================ */

function renderDurationFields(step, index) {
  return `
    <h3>Varighed</h3>

    <label>Varighedstype</label>
    <select onchange="updateStep(${index}, 'durationType', this.value)">
      <option value="time" ${step.durationType === "time" ? "selected" : ""}>Tid</option>
      <option value="distance" ${step.durationType === "distance" ? "selected" : ""}>Distance</option>
    </select>

    ${
      step.durationType === "time"
        ? `
        <label>Varighed</label>
        <div class="duration-row">
          <div class="duration-field">
            <input type="number" min="0" value="${step.hours || 0}"
                   onchange="updateStep(${index}, 'hours', parseInt(this.value))">
            <span>t</span>
          </div>

          <div class="duration-field">
            <input type="number" min="0" max="59" value="${step.minutes || 0}"
                   onchange="updateStep(${index}, 'minutes', parseInt(this.value))">
            <span>m</span>
          </div>

          <div class="duration-field">
            <input type="number" min="0" max="59" value="${step.seconds || 0}"
                   onchange="updateStep(${index}, 'seconds', parseInt(this.value))">
            <span>s</span>
          </div>
        </div>
      `
        : `
        <label>Distance</label>
        <input type="number" step="0.01" value="${step.distance || 1}"
               onchange="updateStep(${index}, 'distance', parseFloat(this.value))"> km
      `
    }
  `;
}


/* ============================
   INTENSITETSFELT
   ============================ */

function renderIntensityField(step, index) {
  return `
    <h3>Intensitetsmål</h3>

    <label>Måltype</label>
    <select onchange="updateStep(${index}, 'intensity', this.value)">
      <option value="E" ${step.intensity === "E" ? "selected" : ""}>E: Easy Pace</option>
      <option value="M" ${step.intensity === "M" ? "selected" : ""}>M: Marathon Pace</option>
      <option value="T" ${step.intensity === "T" ? "selected" : ""}>T: Tempo Pace</option>
      <option value="I" ${step.intensity === "I" ? "selected" : ""}>I: Interval Pace</option>
      <option value="R" ${step.intensity === "R" ? "selected" : ""}>R: Repetition Pace</option>
    </select>
  `;
}


/* ============================
   OPDATERING AF TRIN-DATA
   ============================ */

function updateStep(index, key, value) {
  const session = getCurrentSession();
  if (!session) return;

  const step = session.steps[index];
  step[key] = value;

  renderMain();
  editStep(index);
}


/* ============================
   TILFØJ / SLET / FLYT TRIN
   ============================ */

function addStep() {
  const session = getCurrentSession();
  if (!session) return;

  session.steps.push({
    type: "run",
    mode: "simple",
    durationType: "distance",
    distance: 1,
    notes: "",
    intensity: "E"
  });

  renderMain();
  renderEditor();
}

function deleteStep(index) {
  const session = getCurrentSession();
  if (!session) return;

  session.steps.splice(index, 1);
  renderMain();
  renderEditor();
  updateJsonPreview(session);
}

function moveStepUp(index) {
  const session = getCurrentSession();
  if (!session) return;
  if (index === 0) return;

  const tmp = session.steps[index];
  session.steps[index] = session.steps[index - 1];
  session.steps[index - 1] = tmp;

  renderMain();
  editStep(index - 1);
}

function moveStepDown(index) {
  const session = getCurrentSession();
  if (!session) return;
  if (index === session.steps.length - 1) return;

  const tmp = session.steps[index];
  session.steps[index] = session.steps[index + 1];
  session.steps[index + 1] = tmp;

  renderMain();
  editStep(index + 1);
}


/* ============================
   JSON PREVIEW
   ============================ */

function updateJsonPreview(session) {
  const container = document.getElementById("jsonPreview");
  if (!container) return;
  container.textContent = JSON.stringify(session, null, 2);
}


/* ============================
   WINDOW EXPORTS
   ============================ */

window.renderEditor = renderEditor;
window.editStep = editStep;
window.updateStep = updateStep;
window.addStep = addStep;
window.deleteStep = deleteStep;
window.moveStepUp = moveStepUp;
window.moveStepDown = moveStepDown;
window.toggleRunMode = toggleRunMode;
window.updateJsonPreview = updateJsonPreview;
window.updateSessionField = updateSessionField;
