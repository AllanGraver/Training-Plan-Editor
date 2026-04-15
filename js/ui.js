"use strict";

/* =========================================================
   UI STATE
   ========================================================= */
let selectedWeek = 1;

// VIGTIGT: selectedSessionIndex er GLOBAL index i plan.sessions
let selectedSessionIndex = null;

// JSON preview toggle state (persist i runtime)
let showJsonPreview = false;


/* =========================================================
   HELPERS
   ========================================================= */
function safeText(v, fallback = "") {
  return (v === undefined || v === null) ? fallback : String(v);
}

function parseFirstNumber(str) {
  if (!str) return null;
  const s = String(str).trim().replace(",", ".");
  const m = s.match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

function ensurePlanShape() {
  // Gør det robust hvis plan ikke er sat korrekt endnu
  if (typeof window.plan !== "object" || window.plan === null) {
    window.plan = { duration_weeks: 12, sessions: [] };
  }
  if (!Array.isArray(plan.sessions)) plan.sessions = [];
  if (!plan.duration_weeks) plan.duration_weeks = 12;

  // Sikrer at selectedWeek er indenfor range
  const maxWeeks = Number(plan.duration_weeks) || 1;
  if (selectedWeek < 1) selectedWeek = 1;
  if (selectedWeek > maxWeeks) selectedWeek = maxWeeks;
}

function getWeekSessionRefs() {
  // Returnerer sessioner i valgt uge som: [{ s, globalIndex }]
  const refs = [];
  for (let gi = 0; gi < plan.sessions.length; gi++) {
    const s = plan.sessions[gi];
    if (s && s.week === selectedWeek) {
      refs.push({ s, globalIndex: gi });
    }
  }
  return refs;
}

function getSelectedSession() {
  if (selectedSessionIndex == null) return null;
  return plan.sessions[selectedSessionIndex] || null;
}

function setJsonVisible(visible) {
  showJsonPreview = !!visible;

  // I din HTML ligger JSON som:
  // <h3>JSON</h3>
  // <div id="jsonPreview"></div>
  // Vi skjuler/viser kun preview-div'en + forsøger at skjule overskriften hvis den er lige før.
  const json = document.getElementById("jsonPreview");
  if (!json) return;

  json.style.display = showJsonPreview ? "block" : "none";

  // Skjul/vis evt. <h3> elementet lige før jsonPreview
  const prev = json.previousElementSibling;
  if (prev && prev.tagName === "H3" && prev.textContent.trim().toLowerCase() === "json") {
    prev.style.display = showJsonPreview ? "block" : "none";
  }
}

function updateJsonPreview(session) {
  const json = document.getElementById("jsonPreview");
  if (!json) return;

  if (!session) {
    json.textContent = "";
    return;
  }
  json.textContent = JSON.stringify(session, null, 2);
}

function rerenderAll() {
  renderWeeks();
  renderMain();
  renderEditor();
}


/* =========================================================
   RENDER UGER (venstre panel)
--------------------------------------------------------- */
function renderWeeks() {
  ensurePlanShape();

  const weekList = document.getElementById("weekList");
  if (!weekList) return;

  weekList.innerHTML = "";

  const maxWeeks = Number(plan.duration_weeks) || 1;

  for (let w = 1; w <= maxWeeks; w++) {
    const div = document.createElement("div");
    div.className = "plan-item";
    div.textContent = "Uge " + w;

    // (valgfrit) marker valgt uge visuelt via inline (ingen farver ændres i css)
    if (w === selectedWeek) {
      div.style.borderColor = "#fc4c02";
    }

    div.onclick = () => {
      selectedWeek = w;
      selectedSessionIndex = null;
      renderMain();
      renderEditor();
      // Fokus på main for bedre flow (valgfrit)
      document.getElementById("main")?.focus?.();
    };

    weekList.appendChild(div);
  }
}


/* =========================================================
   RENDER MIDTERPANELET (ugevisning + pas)
--------------------------------------------------------- */
function renderMain() {
  ensurePlanShape();

  const main = document.getElementById("main");
  if (!main) return;

  main.innerHTML = "";

  const weekCard = document.createElement("div");
  weekCard.className = "week-card";

  weekCard.innerHTML = `<h2>Uge ${selectedWeek}</h2>`;

  const refs = getWeekSessionRefs();

  /* Hvis ingen pas i ugen */
  if (refs.length === 0) {
    const empty = document.createElement("div");
    empty.style.padding = "10px 0";
    empty.style.color = "#777";
    empty.textContent = "Ingen træningspas i denne uge endnu.";
    weekCard.appendChild(empty);
  }

  /* VIS PAS I UGEN */
  refs.forEach(({ s, globalIndex }) => {
    const row = document.createElement("div");
    row.className = "session-row";

    row.innerHTML = `
      <div>
        <div class="session-title">${safeText(s.title, "Nyt pas")}</div>
        <div class="session-meta">
          ${s.distance_km ?? "-"} km • ${s.duration_min ?? "-"} min
        </div>
      </div>

      <div>
        <div class="edit-btn" data-action="edit" data-idx="${globalIndex}te" data-idx="${globalIndex}"
             style="background:#d9534f;margin-top:5px
  weekCard.addEventListener("click", (e) => {
    const btn = e.target.closest(".edit-btn");
    if (!btn) return;

    const idx = Number(btn.getAttribute("data-idx"));
    const action = btn.getAttribute("data-action");

    if (Number.isNaN(idx)) return;

    if (action === "edit") editSession(idx);
    if (action === "delete") deleteSession(idx);
  });

  /* TILFØJ PAS */
  const addBtn = document.createElement("button");
  addBtn.textContent = "+ Tilføj pas";
  addBtn.style.marginTop = "15px";
  addBtn.onclick = addSession;

  weekCard.appendChild(addBtn);

  main.appendChild(weekCard);
}


/* =========================================================
   EDIT PAS (global index)
========================================================= */
function editSession(globalIndex) {
  selectedSessionIndex = globalIndex;
  renderEditor();
  document.getElementById("editorPanel")?.focus?.();
}


/* =========================================================
   TILFØJ PAS
========================================================= */
function addSession() {
  ensurePlanShape();

  const newSession = {
    week: selectedWeek,
    title: "Nyt pas",
    day: "Mandag",
    note: "",
    distance_km: null,
    duration_min: null
    // segments: [] // tilføj hvis du bruger segments i din app
  };

  plan.sessions.push(newSession);

  selectedSessionIndex = plan.sessions.length - 1;

  renderMain();
  renderEditor();
  document.getElementById("editorPanel")?.focus?.();
}


/* =========================================================
   SLET PAS (global index)
========================================================= */
function deleteSession(globalIndex) {
  if (!confirm("Vil du slette dette pas?")) return;

  plan.sessions.splice(globalIndex, 1);

  // Juster selection stabilt
  if (selectedSessionIndex === globalIndex) {
    selectedSessionIndex = null;
  } else if (selectedSessionIndex != null && selectedSessionIndex > globalIndex) {
    selectedSessionIndex--;
  }

  renderMain();
  renderEditor();
}


/* =========================================================
   RENDER EDITOR (højre panel)
   - Tid/Distance varighedstype (kun de to)
   - Gemmer i distance_km eller duration_min (rydder den anden)
   - Vis/Skjul JSON (advanced)
========================================================= */
function renderEditor() {
  ensurePlanShape();

  const editor = document.getElementById("sessionEditor");
  if (!editor) return;

  const session = getSelectedSession();

  // Ingen valgt session
  if (!session) {
    editor.innerHTML = "Vælg et pas…";
    updateJsonPreview(null);
    // Skjul JSON som default hvis man vil
    setJsonVisible(showJsonPreview);
    return;
  }

  // Byg editor UI
  editor.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;">
      <div style="font-weight:800;">${safeText(session.title, "Rediger pas")}</div>
      <button type="button" id="btnToggleJson" style="width:auto;margin-top:0;padding:6px 10px;border-radius:6px;">
        ${showJsonPreview ? "Skjul JSON" : "Vis JSON"}
      </button>
    </div>

    <div style="margin-top:16px;">
      <div style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#666;">
        Pasoplysninger
      </div>

      <label for="titleInput">Titel</label>
      <input id="titleInput" type="text" />

      <label for="daySelect">Dag</label>
      <select id="daySelect">
        <option>Mandag</option>
        <option>Tirsdag</option>
        <option>Onsdag</option>
        <option>Torsdag</option>
        <option>Fredag</option>
        <option>Lørdag</option>
        <option>Søndag</option>
      </select>

      <label for="noteInput">Note</label>
      <textarea id="noteInput" rows="3"></textarea>
    </div>

    <div style="margin-top:18px;">
      <div style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#666;">
        Varighed
      </div>

      <label for="durationType">Varighedstype</label>
      <select id="durationType">
        <option value="time">Tid</option>
        <option value="distance">Distance</option>
      </select>

      <label for="durationValue" id="durationValueLabel">Varighed</label>
      <input id="durationValue" type="text" />
      <small id="durationHelp" style="display:block;margin-top:6px;font-size:12px;opacity:.75;"></small>
    </div>

    <div style="margin-top:18px;">
      <div style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#666;">
        Handlinger
      </div>

      <button type="button" id="btnEditSegments">Rediger segmenter</button>
      <button type="button" id="btnCalcKmMin">Beregn km/min</button>
      <button type="button" id="btnSaveSession">Gem</button>
    </div>
  `;

  // Field refs
  const titleInput = document.getElementById("titleInput");
  const daySelect = document.getElementById("daySelect");
  const noteInput = document.getElementById("noteInput");

  const durationType = document.getElementById("durationType");
  const durationValue = document.getElementById("durationValue");
  const durationValueLabel = document.getElementById("durationValueLabel");
  const durationHelp = document.getElementById("durationHelp");

  const btnToggleJson = document.getElementById("btnToggleJson");
  const btnEditSegments = document.getElementById("btnEditSegments");
  const btnCalcKmMin = document.getElementById("btnCalcKmMin");
  const btnSaveSession = document.getElementById("btnSaveSession");

  // Init inputs from session
  titleInput.value = safeText(session.title, "Nyt pas");
  daySelect.value = safeText(session.day, "Mandag");
  noteInput.value = safeText(session.note, "");

  // Bestem varighedstype ud fra sessiondata
  // Default: Distance (matcher din reference)
  if (session.distance_km != null && session.distance_km !== "") {
    durationType.value = "distance";
    durationValue.value = String(session.distance_km);
  } else if (session.duration_min != null && session.duration_min !== "") {
    durationType.value = "time";
    durationValue.value = String(session.duration_min);
  } else {
    durationType.value = "distance";
    durationValue.value = "";
  }

  function updateDurationUI() {
    const t = durationType.value;

    if (t === "time") {
      if (durationValueLabel) durationValueLabel.textContent = "Varighed";
      durationValue.placeholder = "fx 30 min";
      durationHelp.textContent = "Angiv tid i minutter (fx 30).";
    } else {
      if (durationValueLabel) durationValueLabel.textContent = "Varighed";
      durationValue.placeholder = "fx 5 km";
      durationHelp.textContent = "Angiv distance i kilometer (fx 5).";
    }
  }

  function saveDurationToSession() {
    const t = durationType.value;
    const raw = durationValue.value.trim();

    if (!raw) {
      session.distance_km = null;
      session.duration_min = null;
      btnCalcKmMin.disabled = true;
      return;
    }

    const n = parseFirstNumber(raw);
    if (n == null || n <= 0) {
      session.distance_km = null;
      session.duration_min = null;
      btnCalcKmMin.disabled = true;
      return;
    }

    if (t === "distance") {
      session.distance_km = n;
      session.duration_min = null;
      // normaliser input til tal
      durationValue.value = String(n);
    } else {
      session.duration_min = Math.round(n);
      session.distance_km = null;
      durationValue.value = String(Math.round(n));
    }

    btnCalcKmMin.disabled = false;
  }

  function syncSessionFromInputs() {
    session.title = titleInput.value.trim() || "Nyt pas";
    session.day = daySelect.value;
    session.note = noteInput.value;

    saveDurationToSession();
    updateJsonPreview(session);
    renderMain();
  }

  // Events
  titleInput.addEventListener("input", syncSessionFromInputs);
  daySelect.addEventListener("change", syncSessionFromInputs);
  noteInput.addEventListener("input", syncSessionFromInputs);

  durationType.addEventListener("change", () => {
    updateDurationUI();
    syncSessionFromInputs();
  });

  durationValue.addEventListener("input", syncSessionFromInputs);
  durationValue.addEventListener("blur", syncSessionFromInputs);

  btnToggleJson.addEventListener("click", () => {
    setJsonVisible(!showJsonPreview);
    btnToggleJson.textContent = showJsonPreview ? "Skjul JSON" : "Vis JSON";
  });

  // Handlinger: kør kun hvis funktion findes
  btnEditSegments.addEventListener("click", () => {
    if (typeof window.editSegments === "function") {
      window.editSegments(session, selectedSessionIndex);
    } else {
      alert("Funktionen editSegments() findes ikke endnu.");
    }
  });

  btnCalcKmMin.addEventListener("click", () => {
    if (typeof window.calculateKmMin === "function") {
      window.calculateKmMin(session, selectedSessionIndex);
      // Efter beregning kan session være ændret -> opdater UI
      updateJsonPreview(session);
      renderMain();
    } else {
      alert("Funktionen calculateKmMin() findes ikke endnu.");
    }
  });

  btnSaveSession.addEventListener("click", () => {
    // Din app gemmer typisk hele planen via "Gem plan / Gem som ny"
    // Denne knap bekræfter bare UI-state.
    syncSessionFromInputs();
  });

  // Init UI states
  updateDurationUI();
  saveDurationToSession(); // aktiver/deaktiver calc knap korrekt
  updateJsonPreview(session);
  setJsonVisible(showJsonPreview);
}


/* =========================================================
   INIT (kan kaldes fra app.js)
========================================================= */
function initUI() {
  ensurePlanShape();
  rerenderAll();
}

// Eksportér til global scope (så inline onclick i HTML stadig virker)
window.renderWeeks = renderWeeks;
window.renderMain = renderMain;
window.renderEditor = renderEditor;
window.editSession = editSession;
window.addSession = addSession;
window.deleteSession = deleteSession;
window.initUI = initUI;
