"use strict";
/* =========================================================
   FILE: steps.js
   PURPOSE:
   - Højre panel: editor for trin (steps)
   - Redigering af type, noter, varighed, intensitet
   - Flyt/slet trin (inkl. blokke med blockId)
   - JSON preview
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
   EDIT STEP
   ============================ */

function editStep(index) {
  const session = getCurrentSession();
  if (!session) return;

  const step = session.steps[index];
  const editor = document.getElementById("sessionEditor");
  if (!editor) return;

  editor.innerHTML = `
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
                   onchange="updateStep(${index}, 'hours', parseInt(this.value) || 0)">
            <span>t</span>
          </div>

          <div class="duration-field">
            <input type="number" min="0" max="59" value="${step.minutes || 0}"
                   onchange="updateStep(${index}, 'minutes', parseInt(this.value) || 0)">
            <span>m</span>
          </div>

          <div class="duration-field">
            <input type="number" min="0" max="59" value="${step.seconds || 0}"
                   onchange="updateStep(${index}, 'seconds', parseInt(this.value) || 0)">
            <span>s</span>
          </div>
        </div>
      `
        : `
        <label>Distance</label>
        <input type="number" step="0.01" value="${step.distance || 1}"
               onchange="updateStep(${index}, 'distance', parseFloat(this.value) || 0)"> km
      `
    }

    <h3>Intensitet</h3>
    <select onchange="updateStep(${index}, 'intensity', this.value)">
      <option value="E" ${step.intensity === "E" ? "selected" : ""}>E: Easy</option>
      <option value="M" ${step.intensity === "M" ? "selected" : ""}>M: Marathon</option>
      <option value="T" ${step.intensity === "T" ? "selected" : ""}>T: Tempo</option>
      <option value="I" ${step.intensity === "I" ? "selected" : ""}>I: Interval</option>
      <option value="R" ${step.intensity === "R" ? "selected" : ""}>R: Repetition</option>
    </select>
  `;

  updateJsonPreview(session);
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
   HJÆLPERE TIL FLYTNING AF TRIN/BLOKKE
   ============================ */

function moveSingleStep(index, direction) {
  const session = getCurrentSession();
  if (!session) return;

  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= session.steps.length) return;

  const tmp = session.steps[index];
  session.steps[index] = session.steps[newIndex];
  session.steps[newIndex] = tmp;
}

function moveBlock(blockId, direction) {
  const session = getCurrentSession();
  if (!session) return;

  const indices = session.steps
    .map((s, i) => ({ s, i }))
    .filter(x => x.s.blockId === blockId)
    .map(x => x.i);

  if (indices.length === 0) return;

  const first = indices[0];
  const last = indices[indices.length - 1];

  const target = direction < 0 ? first - 1 : last + 1;
  if (target < 0 || target >= session.steps.length) return;

  const block = session.steps.splice(first, indices.length);
  const insertIndex = direction < 0 ? first - 1 : first + 1;
  session.steps.splice(insertIndex, 0, ...block);
}


/* ============================
   TILFØJ / SLET / FLYT TRIN
   ============================ */

function deleteStep(index) {
  const session = getCurrentSession();
  if (!session) return;

  const step = session.steps[index];
  
// Hvis det er et anker: slet hele blokken
  if (step.blockId && step.blockAnchor) {
    session.steps = session.steps.filter(s => s.blockId !== step.blockId);
  } 
  // Hvis det blot er et medlem i blokken: slet kun dette trin
  else {
    session.steps.splice(index, 1);
  }

  // ✅ re-beregn blokke (opløs/tilpas medlemskab)
  recomputeIntervalBlocks(session);

  if (session.steps.length === 0) {
    deleteSession(selectedSessionIndex);
    return;
  }

  renderMain();
  renderEditor();
}

function moveStepUp(index) {
  const session = getCurrentSession();
  if (!session) return;

  const step = session.steps[index];
  
// flyt enkelt-trin
  moveSingleStep(index, -1);

  // ✅ auto ind/ud af intervalrammen
  recomputeIntervalBlocks(session);

  renderMain();
  renderEditor();
}

function moveStepDown(index) {
  const session = getCurrentSession();
  if (!session) return;

  const step = session.steps[index];
  
// flyt enkelt-trin
  moveSingleStep(index, 1);

  // ✅ auto ind/ud af intervalrammen
  recomputeIntervalBlocks(session);

  renderMain();
  renderEditor();
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
window.deleteStep = deleteStep;
window.moveStepUp = moveStepUp;
window.moveStepDown = moveStepDown;
window.updateJsonPreview = updateJsonPreview;
