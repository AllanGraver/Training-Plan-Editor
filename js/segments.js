function editSegments() {
  const session = plan.sessions.filter(s => s.week === selectedWeek)[selectedSessionIndex];

  // Åbn modal
  const modal = window.open("", "Segments", "width=750,height=900");

  // Ryd alt indhold
  modal.document.body.innerHTML = "";

  // Titel
  const title = modal.document.createElement("h2");
  title.textContent = "Rediger segmenter";
  modal.document.body.appendChild(title);

  // Container til JSONEditor
  const container = modal.document.createElement("div");
  container.style.height = "400px";
  container.style.border = "1px solid #ccc";
  container.style.marginBottom = "15px";
  modal.document.body.appendChild(container);

  // JSONEditor
  const editor = new JSONEditor(container, { mode: "tree" });
  editor.set(session.segments);

  /* -----------------------------
     PRESETS
  ------------------------------ */
  const PRESETS = {
    "30-20-10": {
      type: "interval_block",
      repetitions: 3,
      steps: [
        { duration_min: 0.5, note: "30 sek hårdt" },
        { duration_min: 0.333, note: "20 sek moderat" },
        { duration_min: 0.166, note: "10 sek hurtigt" }
      ]
    },
    "Fartleg": {
      type: "interval_block",
      repetitions: 6,
      steps: [
        { duration_min: 2, note: "2 min hurtigt" },
        { duration_min: 1, note: "1 min roligt" }
      ]
    },
    "Pyramide": {
      type: "interval_block",
      repetitions: 1,
      steps: [
        { duration_min: 1, note: "1 min hårdt" },
        { duration_min: 2, note: "2 min hårdt" },
        { duration_min: 3, note: "3 min hårdt" },
        { duration_min: 2, note: "2 min hårdt" },
        { duration_min: 1, note: "1 min hårdt" }
      ]
    },
    "Progressivt løb": {
      type: "interval_block",
      repetitions: 1,
      steps: [
        { duration_min: 10, note: "Roligt" },
        { duration_min: 10, note: "Moderat" },
        { duration_min: 10, note: "Hårdt" }
      ]
    }
  };

  /* -----------------------------
     BUTTON BAR
  ------------------------------ */
  const bar = modal.document.createElement("div");
  bar.style.marginBottom = "20px";

  function addButton(label, onclick) {
    const btn = modal.document.createElement("button");
    btn.textContent = label;
    btn.style.marginRight = "10px";
    btn.onclick = onclick;
    bar.appendChild(btn);
  }

  // Tilføj segment
  addButton("+ Tilføj segment", () => {
    const segs = editor.get();
    segs.push({
      type: "interval_block",
      repetitions: 1,
      steps: []
    });
    editor.set(segs);
  });

  // Tilføj step
  addButton("+ Tilføj step", () => {
    const segs = editor.get();
    const block = segs.find(s => s.type === "interval_block");

    if (!block) return alert("Ingen intervalblok fundet.");

    block.steps = block.steps || [];
    block.steps.push({ duration_min: 1, note: "Nyt step" });

    editor.set(segs);
  });

  // Slet step
  addButton("Slet sidste step", () => {
    const segs = editor.get();
    const block = segs.find(s => s.type === "interval_block");

    if (!block || !block.steps || block.steps.length === 0)
      return alert("Ingen steps at slette.");

    block.steps.pop();
    editor.set(segs);
  });

  // Presets
  const presetTitle = modal.document.createElement("h3");
  presetTitle.textContent = "Interval presets";
  presetTitle.style.marginTop = "20px";
  modal.document.body.appendChild(bar);
  modal.document.body.appendChild(presetTitle);

  const presetBar = modal.document.createElement("div");
  presetBar.style.marginBottom = "20px";

  Object.keys(PRESETS).forEach(name => {
    addButton(name, () => {
      const segs = editor.get();
      segs.push(PRESETS[name]);
      editor.set(segs);
    });
  });

  modal.document.body.appendChild(presetBar);

  // Gem
  const saveBtn = modal.document.createElement("button");
  saveBtn.textContent = "Gem segmenter";
  saveBtn.style.background = "#0078d4";
  saveBtn.style.color = "white";
  saveBtn.style.padding = "10px 20px";
  saveBtn.onclick = () => {
    session.segments = editor.get();
    modal.close();
    renderEditor();
  };

  modal.document.body.appendChild(saveBtn);
}
