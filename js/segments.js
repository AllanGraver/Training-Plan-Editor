/* ---------------------------------------------------------
   VISUEL INTERVAL-EDITOR + SEGMENT-OVERBLIK
--------------------------------------------------------- */

function editSegments() {
  const session = plan.sessions.filter(s => s.week === selectedWeek)[selectedSessionIndex];

  const editorDiv = document.getElementById("sessionEditor");
  editorDiv.innerHTML = "<h3>Segmenter</h3>";

  /* ---------------------------------------------------------
     VISUELT OVERBLIK OVER EKSISTERENDE SEGMENTER
  --------------------------------------------------------- */

  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "15px";
  editorDiv.appendChild(container);

  session.segments.forEach((seg, segIndex) => {
    const segCard = document.createElement("div");
    segCard.style.border = "1px solid #ccc";
    segCard.style.padding = "10px";
    segCard.style.borderRadius = "6px";
    segCard.style.background = "#fafafa";

    segCard.innerHTML = `
      <strong>Segment ${segIndex + 1}</strong><br>
      <label>Type:</label>
      <input value="${seg.type}" data-seg="${segIndex}" data-field="type" style="width:100%; margin-bottom:5px;">
    `;

    // Gentagelser
    if (seg.type === "interval_block") {
      const repLabel = document.createElement("div");
      repLabel.innerHTML = "<label>Gentagelser:</label>";
      segCard.appendChild(repLabel);

      const repInput = document.createElement("input");
      repInput.type = "number";
      repInput.value = seg.repetitions || 1;
      repInput.dataset.seg = segIndex;
      repInput.dataset.field = "repetitions";
      repInput.style.width = "80px";
      repInput.style.marginBottom = "10px";
      segCard.appendChild(repInput);
    }

    /* ---------------------------------------------------------
       STEPS
    --------------------------------------------------------- */

    const stepList = document.createElement("div");
    stepList.style.marginTop = "10px";

    seg.steps = seg.steps || [];

    seg.steps.forEach((step, stepIndex) => {
      const stepRow = document.createElement("div");
      stepRow.style.display = "flex";
      stepRow.style.gap = "10px";
      stepRow.style.marginBottom = "5px";

      stepRow.innerHTML = `
        <input type="number" value="${step.duration_min}" data-seg="${segIndex}" data-step="${stepIndex}" data-field="duration_min" style="width:80px;">
        <input type="text" value="${step.note || ""}" data-seg="${segIndex}" data-step="${stepIndex}" data-field="note" style="flex:1;">
        <button data-seg="${segIndex}" data-step="${stepIndex}" class="deleteStepBtn">🗑️</button>
      `;

      stepList.appendChild(stepRow);
    });

    segCard.appendChild(stepList);

    // Tilføj step
    const addStepBtn = document.createElement("button");
    addStepBtn.textContent = "➕ Tilføj step";
    addStepBtn.dataset.seg = segIndex;
    addStepBtn.onclick = () => {
      seg.steps.push({ duration_min: 1, note: "" });
      renderEditor();
    };
    segCard.appendChild(addStepBtn);

    // Slet segment
    const deleteSegBtn = document.createElement("button");
    deleteSegBtn.textContent = "🗑️ Slet segment";
    deleteSegBtn.style.marginLeft = "10px";
    deleteSegBtn.dataset.seg = segIndex;
    deleteSegBtn.onclick = () => {
      session.segments.splice(segIndex, 1);
      renderEditor();
    };
    segCard.appendChild(deleteSegBtn);

    container.appendChild(segCard);
  });

  /* ---------------------------------------------------------
     TILFØJ NYT SEGMENT
  --------------------------------------------------------- */

  const addSegBtn = document.createElement("button");
  addSegBtn.textContent = "➕ Tilføj nyt segment";
  addSegBtn.onclick = () => {
    session.segments.push({
      type: "interval_block",
      repetitions: 1,
      steps: []
    });
    renderEditor();
  };
  editorDiv.appendChild(addSegBtn);

  /* ---------------------------------------------------------
     INPUT HANDLING
  --------------------------------------------------------- */

  editorDiv.querySelectorAll("input").forEach(input => {
    input.onchange = () => {
      const seg = session.segments[input.dataset.seg];

      if (input.dataset.step !== undefined) {
        const step = seg.steps[input.dataset.step];
        step[input.dataset.field] = input.type === "number"
          ? Number(input.value)
          : input.value;
      } else {
        seg[input.dataset.field] = input.type === "number"
          ? Number(input.value)
          : input.value;
      }

      renderEditor();
    };
  });

  editorDiv.querySelectorAll(".deleteStepBtn").forEach(btn => {
    btn.onclick = () => {
      const seg = session.segments[btn.dataset.seg];
      seg.steps.splice(btn.dataset.step, 1);
      renderEditor();
    };
  });

  /* ---------------------------------------------------------
     OPDATER JSON PREVIEW
  --------------------------------------------------------- */

  const previewDiv = document.getElementById("jsonPreview");
  previewDiv.textContent = JSON.stringify(session, null, 2);
}
