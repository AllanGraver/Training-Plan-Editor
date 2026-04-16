"use strict";

/* =========================================================
   FILE: steps.js
   PURPOSE:
   - Højre panel: editor for trin
   ========================================================= */

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

function editStep(index) {
  const session = getCurrentSession();
  if (!session) return;

  const step = session.steps[index];
  const editor = document.getElementById("sessionEditor");

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

function updateStep(index, key, value) {
  const session = getCurrentSession();
  const step = session.steps[index];

  step[key] = value;

  renderMain();
  editStep(index);
}

function deleteStep(index) {
  const session = getCurrentSession();
  session.steps.splice(index, 1);

  if (session.steps.length === 0) {
    deleteSession(selectedSessionIndex);
    return;
  }

  renderMain();
  renderEditor();
}

function moveStepUp(index) {
  const session = getCurrentSession();
  if (index === 0) return;

  const tmp = session.steps[index];
  session.steps[index] = session.steps[index - 1];
  session.steps[index - 1] = tmp;

  renderMain();
  editStep(index - 1);
}

function moveStepDown(index) {
  const session = getCurrentSession();
  if (index === session.steps.length - 1) return;

  const tmp = session.steps[index];
  session.steps[index] = session.steps[index + 1];
  session.steps[index + 1] = tmp;

  renderMain();
  editStep(index + 1);
}

function updateJsonPreview(session) {
  const container = document.getElementById("jsonPreview");
  container.textContent = JSON.stringify(session, null, 2);
}

window.renderEditor = renderEditor;
window.editStep = editStep;
window.updateStep = updateStep;
window.deleteStep = deleteStep;
window.moveStepUp = moveStepUp;
window.moveStepDown = moveStepDown;
window.updateJsonPreview = updateJsonPreview;
