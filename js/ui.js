"use strict"; if (typeof window.selectedWeek !== "number") window.selectedWeek = 1;
  if (selectedWeek < 1) selectedWeek = 1;
  if (selectedWeek > plan.duration_weeks) selectedWeek = plan.duration_weeks;

  if (window.selectedSessionIndex !== null && typeof window.selectedSessionIndex !== "number") {
    window.selectedSessionIndex = null;
  }
}

function getWeekSessions() {
  return plan.sessions.filter(s => s.week === selectedWeek);
}

function getSelectedSession() {
  if (selectedSessionIndex === null) return null;
  const sessions = getWeekSessions();
  return sessions[selectedSessionIndex] || null;
}

function parseFirstNumber(str) {
  if (!str) return null;
  const s = String(str).trim().replace(",", ".");
  const m = s.match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

function clampDay(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 1;
  return Math.min(7, Math.max(1, x));
}

function dayNameFromNumber(n) {
  const map = {
    1: "Mandag",
    2: "Tirsdag",
    3: "Onsdag",
    4: "Torsdag",
    5: "Fredag",
    6: "Lørdag",
    7: "Søndag"
  };
  return map[Number(n)] || "Mandag";
}

/* ---------------------------------------------------------
   JSON PREVIEW TOGGLE (Avanceret)
--------------------------------------------------------- */
let showJsonPreview = false; // skjult som default (Avanceret)

function setJsonVisible(visible) {
  showJsonPreview = !!visible;

  const json = document.getElementById("jsonPreview");
  if (!json) return;

  json.style.display = showJsonPreview ? "block" : "none";

  // skjul/vis "JSON" overskrift hvis den står lige før jsonPreview
  const prev = json.previousElementSibling;
  if (prev && prev.tagName === "H3" && prev.textContent.trim().toLowerCase() === "json") {
    prev.style.display = showJsonPreview ? "block" : "none";
  }
}

function updateJsonPreview(session) {
  const previewDiv = document.getElementById("jsonPreview");
  if (!previewDiv) return;
  previewDiv.textContent = session ? JSON.stringify(session, null, 2) : "";
}

/* ---------------------------------------------------------
   MIDTERPANELET – live oversigt helpers
--------------------------------------------------------- */
function updateMainActiveSummary(session) {
  const el = document.getElementById("mainActiveSummary");
  if (!el) return;

  const txt = session
    ? `Redigerer: ${session.title ?? "Nyt pas"} (${dayNameFromNumber(session.day)})`
    : "Vælg et pas for at redigere";

  el.textContent = txt;
}

function updateMainRow(idx, session) {
  // Opdater kun den specifikke række (ingen scroll-hop)
  const titleEl = document.getElementById(`title-${idx}`);
  const metaEl = document.getElementById(`meta-${idx}`);
  const rowEl = document.getElementById(`sessionRow-${idx}`);

  if (titleEl) titleEl.textContent = session.title ?? "Nyt pas";

  if (metaEl) {
    const dayTxt = dayNameFromNumber(session.day);
    const km = (session.distance_km ?? "-");
    const min = (session.duration_min ?? "-");
    metaEl.textContent = `${dayTxt} • ${km} km • ${min} min`;
  }

  // Marker aktiv
  if (rowEl) {
    document.querySelectorAll(".session-row.is-active")
      .forEach(el => el.classList.remove("is-active"));
    rowEl.classList.add("is-active");
  }

  updateMainActiveSummary(session);
}

/* =========================================================
   RENDER UGER (venstre panel)
--------------------------------------------------------- */
function renderWeeks() {
  ensurePlan();

  const weekList = document.getElementById("weekList");
  if (!weekList) return;

  weekList.innerHTML = "";

  for (let w = 1; w <= plan.duration_weeks; w++) {
    const div = document.createElement("div");
    div.className = "plan-item";
    div.textContent = "Uge " + w;

    div.onclick = () => {
      selectedWeek = w;
      selectedSessionIndex = null;
      renderMain();
      renderEditor();
    };

    weekList.appendChild(div);
  }
}

/* =========================================================
   RENDER MIDTERPANELET (ugevisning + pas)
   - fungerer som live oversigt
--------------------------------------------------------- */
function renderMain() {
  ensurePlan();

  const main = document.getElementById("main");
  if (!main) return;

  main.innerHTML = "";

  const weekCard = document.createElement("div");
  weekCard.className = "week-card";

  const sessions = getWeekSessions();
  const activeSession = (selectedSessionIndex !== null) ? sessions[selectedSessionIndex] : null;

  const activeText = activeSession
    ? `Redigerer: ${activeSession.title ?? "Nyt pas"} (${dayNameFromNumber(activeSession.day)})`
    : "Vælg et pas for at redigere";

  weekCard.innerHTML = `
    <h2>Uge ${selectedWeek}</h2>
    <div id="mainActiveSummary" style="margin:6px 0 12px;color:#555;font-size:13px;">
      ${activeText}
    </div>
  `;

  /* Hvis ingen pas i ugen */
  if (sessions.length === 0) {
    const empty = document.createElement("div");
    empty.style.padding = "10px 0";
    empty.style.color = "#777";
    empty.textContent = "Ingen træningspas i denne uge endnu.";
    weekCard.appendChild(empty);
  }

  /* VIS PAS I UGEN */
  sessions.forEach((s, i) => {
    const row = document.createElement("div");
    row.className = "session-row";
    row.id = `sessionRow-${i}`;
    row.dataset.idx = String(i);

    if (i === selectedSessionIndex) {
      row.classList.add("is-active");
    }

    const title = s.title ?? "Nyt pas";
    const dayTxt = dayNameFromNumber(s.day);
    const km = (s.distance_km ?? "-");
    const min = (s.duration_min ?? "-");

    row.innerHTML = `
      <div>
        <div class="session-title" id="title-${i}">${title}</div>
        <div class="session-meta" id="meta-${i}">
          ${dayTxt} • ${km} km • ${min} min
        </div>
      </div>

      <div>
        <div class="edit-btn" onclick="editSession(${i})">Rediger</div>
        <div class="edit-btn" style="background:#d9534f;margin-top:5px"
             onclick="deleteSession(${i})">Slet</div>
      </div>
    `;

    weekCard.appendChild(row);
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
   SLET PAS (filtered index -> global index mapping)
--------------------------------------------------------- */
function deleteSession(index) {
  ensurePlan();

  if (!confirm("Vil du slette dette pas?")) return;

  const sessions = getWeekSessions();
  const globalIndex = plan.sessions.indexOf(sessions[index]);
  if (globalIndex === -1) return;

  plan.sessions.splice(globalIndex, 1);

  // Justér selectedSessionIndex (filtered) robust
  if (selectedSessionIndex !== null) {
    if (index === selectedSessionIndex) {
      selectedSessionIndex = null;
    } else if (index < selectedSessionIndex) {
      selectedSessionIndex--;
    }
  }

  renderMain();
  renderEditor();
}

/* =========================================================
   REDIGER PAS (filtered index)
--------------------------------------------------------- */
function editSession(index) {
  selectedSessionIndex = index;
  renderMain();   // så highlight/oversigt opdateres
  renderEditor();
}

/* =========================================================
   TILFØJ NYT PAS (filtered index)
--------------------------------------------------------- */
function addSession() {
  ensurePlan();

  plan.sessions.push({
    week: selectedWeek,
    day: 1,
    title: "Nyt pas",
    distance_km: null,
    duration_min: null,
    note: "",
    segments: []
  });

  // vælg det nyeste pas i ugen (filtered index)
  const sessions = getWeekSessions();
  selectedSessionIndex = sessions.length - 1;

  renderMain();
  renderEditor();
}

/* =========================================================
   RENDER EDITOR (højre panel)
   - Live sync til midterpanelet (oversigt)
   - Varighedstype: Tid/Distance (kun disse)
   - Avanceret: Vis/Skjul JSON
   - Kompatibel med autoCalc() (som kan sætte både km og min)
--------------------------------------------------------- */
function renderEditor() {
  ensurePlan();

  const editorDiv = document.getElementById("sessionEditor");
  if (!editorDiv) return;

  const session = getSelectedSession();

  // Ingen valgt session
  if (!session) {
    editorDiv.innerHTML = "Vælg et pas…";
    updateJsonPreview(null);
    setJsonVisible(showJsonPreview);
    updateMainActiveSummary(null);
    return;
  }

  // Hvis autoCalc har sat både distance_km og duration_min, skal UI ikke automatisk rydde noget
  let lockAutoBoth = (session.distance_km != null && session.duration_min != null);

  // Bestem type & value som UI skal vise
  // Default: distance (som reference)
  function inferTypeFromSession() {
    if (session.distance_km != null && session.duration_min != null) {
      lockAutoBoth = true;
      return "distance";
    }
    lockAutoBoth = false;
    return (session.duration_min != null && session.distance_km == null) ? "time" : "distance";
  }

  const inferredType = inferTypeFromSession();
  const durationValue = inferredType === "time"
    ? (session.duration_min ?? "")
    : (session.distance_km ?? "");

  editorDiv.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;">
      <div style="font-weight:800;">Rediger pas</div>

      <button type="button" id="toggleJsonBtn"
        style="width:auto;margin-top:0;padding:6px 10px;border-radius:6px;">
        ${showJsonPreview ? "Skjul JSON" : "Vis JSON"}
      </button>
    </div>

    <div style="margin-top:14px;">
      <div style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#666;">
        Pasoplysninger
      </div>

      <label>Titel</label>
      <input id="title" value="${session.title ?? "Nyt pas"}" />

      <label>Dag</label>
      <select id="day">
        <option value="1">Mandag</option>
        <option value="2">Tirsdag</option>
        <option value="3">Onsdag</option>
        <option value="4">Torsdag</option>
        <option value="5">Fredag</option>
        <option value="6">Lørdag</option>
        <option value="7">Søndag</option>
      </select>

      <label>Note</label>
      <textarea id="note">${session.note ?? ""}</textarea>
    </div>

    <div style="margin-top:18px;">
      <div style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#666;">
        Varighed
      </div>

      <label>Varighedstype</label>
      <select id="durationType">
        <option value="time">Tid</option>
        <option value="distance">Distance</option>
      </select>

      <label id="durationValueLabel">Varighed</label>
      <input id="durationValue" value="${durationValue}" />
      <small id="durationHelp" style="display:block;margin-top:6px;font-size:12px;opacity:.75;"></small>
    </div>

    <div style="margin-top:18px;">
      <div style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#666;">
        Handlinger
      </div>

      <button type="button" onclick="editSegments()">Rediger segmenter</button>
      <button type="button" onclick="autoCalc()">Beregn km/min</button>
      <button type="button" onclick="saveSession()">Gem</button>
    </div>
  `;

  // Init felter
  const dayEl = document.getElementById("day");
  dayEl.value = String(clampDay(session.day));

  const titleEl = document.getElementById("title");
  const noteEl = document.getElementById("note");

  const durationTypeEl = document.getElementById("durationType");
  const durationValueEl = document.getElementById("durationValue");
  const durationHelpEl = document.getElementById("durationHelp");

  durationTypeEl.value = inferredType;

  function updateDurationUI() {
    const t = durationTypeEl.value;
    if (t === "time") {
      durationValueEl.placeholder = "fx 30 min";
      durationHelpEl.textContent = lockAutoBoth
        ? "Auto-beregnet (både km og min). Redigér feltet hvis du vil overskrive."
        : "Angiv tid i minutter (fx 30).";
    } else {
      durationValueEl.placeholder = "fx 5 km";
      durationHelpEl.text

/* =========================================================
   UI.JS – Træningsplan Editor UI
   ---------------------------------------------------------
   Forventer at app.js definerer:
     - let plan = { duration_weeks, sessions: [...] }
     - let selectedWeek = 1;
     - let selectedSessionIndex = null;

   VIGTIGT:
   selectedSessionIndex = index i sessions for valgt uge (FILTERED index)
   (så autoCalc() / editSegments() fortsat virker som før)
   ========================================================= */

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */
function ensurePlan() {
  if (typeof window.plan !== "object" || window.plan === null) {
    window.plan = {
      plan_name: "Ny træningsplan",
      duration_weeks: 12,
      race_distance_km: null,
      sessions: []
    };
  }
  if (!Array.isArray(plan.sessions)) plan.sessions = [];
  if (!plan.duration_weeks) plan.duration_weeks = 12;

