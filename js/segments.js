"use strict";
/* =========================================================
   FILE: segments.js
   PURPOSE:
   - Interval-editor for run-steps i mode "interval"
   - Redigering af segments, repetitions og steps i segmenter
   - Opdaterer JSON preview og main-view
   ========================================================= */

function editSegments(stepIndex) {
  const session = getCurrentSession();
  if (!session) return;

  const step = session.steps[stepIndex];

  if (!step.segments) {
    step.segments = [];
  }

  const editor = document.getElementById("sessionEditor");
  if (!editor) return;

  editor.innerHTML = `
    <h3>Intervaller</h3>
    <p>Rediger segmenter og steps for dette intervaltrin.</p>
  `;

  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "15px";
  editor.appendChild(container);

  step.segments.forEach((seg, segIndex) => {
    const segCard = document.createElement("div");
    segCard.className = "segment-card";
    segCard.style.border = "1px solid #ccc";
    segCard.style.padding = "12px";
    segCard.style.borderRadius = "6px";
    segCard.style.background = "#fafafa";

    segCard.innerHTML = `
      <strong>Segment ${segIndex + 1}</strong><br><br>

      <label>Gentagelser</label>
      <input type="number" min="1" value="${seg.repetitions || 1}"
             data-seg="${segIndex}" data-field="repetitions"
             style="width:80px; margin-bottom:10px;">
    `;

    const stepList = document.createElement("div");
    stepList.style.marginTop = "10px";

    seg.steps = seg.steps || [];

    seg.steps.forEach((s, sIndex) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.gap = "10px";
      row.style.marginBottom = "6px";

      row.innerHTML = `
        <input type="number" min="0" step="0.1"
               value="${s.duration_min}"
               data-seg="${segIndex}" data-step="${sIndex}" data-field="duration_min"
               style="width:80px;">

        <input type="text"
               value="${s.note || ""}"
               data-seg="${segIndex}" data-step="${sIndex}" data-field="note"
               style="flex:1;">

        <button class="deleteStepBtn"
                data-seg="${segIndex}" data-step="${sIndex}">
          🗑️
        </button>
      `;

      stepList.appendChild(row);
    });

    segCard.appendChild(stepList);

    const addStepBtn = document.createElement("button");
    addStepBtn.textContent = "➕ Tilføj step";
    addStepBtn.dataset.seg = segIndex;
    addStepBtn.onclick = () => {
      seg.steps.push({ duration_min: 1, note: "" });
      editSegments(stepIndex);
    };
    segCard.appendChild(addStepBtn);

    const deleteSegBtn = document.createElement("button");
    deleteSegBtn.textContent = "🗑️ Slet segment";
    deleteSegBtn.style.marginLeft = "10px";
    deleteSegBtn.dataset.seg = segIndex;
    deleteSegBtn.onclick = () => {
      step.segments.splice(segIndex, 1);
      editSegments(stepIndex);
    };
    segCard.appendChild(deleteSegBtn);

    container.appendChild(segCard);
  });

  const addSegBtn = document.createElement("button");
  addSegBtn.textContent = "➕ Tilføj nyt segment";
  addSegBtn.onclick = () => {
    step.segments.push({
      repetitions: 1,
      steps: [
        { duration_min: 2, note: "Hurtigt" },
        { duration_min: 1, note: "Roligt" }
      ]
    });
    editSegments(stepIndex);
  };
  editor.appendChild(addSegBtn);

  editor.querySelectorAll("input").forEach(input => {
    input.onchange = () => {
      const seg = step.segments[input.dataset.seg];

      if (input.dataset.step !== undefined) {
        const s = seg.steps[input.dataset.step];
        s[input.dataset.field] =
          input.type === "number" ? Number(input.value) : input.value;
      } else {
        seg[input.dataset.field] =
          input.type === "number" ? Number(input.value) : input.value;
      }

      updateJsonPreview(session);
      renderMain();
    };
  });

  editor.querySelectorAll(".deleteStepBtn").forEach(btn => {
    btn.onclick = () => {
      const seg = step.segments[btn.dataset.seg];
      seg.steps.splice(btn.dataset.step, 1);
      editSegments(stepIndex);
    };
  });

  updateJsonPreview(session);
}

/* ============================
   WINDOW EXPORT
   ============================ */

window.editSegments = editSegments;
