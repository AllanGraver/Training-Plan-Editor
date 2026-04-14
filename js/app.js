let plan = {
  plan_name: "Ny træningsplan",
  duration_weeks: 12,
  race_distance_km: null,
  sessions: []
};

let selectedWeek = 1;
let selectedSessionIndex = null;

/* -----------------------------------
   REDIGER PAS
----------------------------------- */
function editSession(index) {
  selectedSessionIndex = index;
  renderEditor();
}

/* -----------------------------------
   RENDER EDITOR (højre panel)
----------------------------------- */
function renderEditor() {
  const editorDiv = document.getElementById("sessionEditor");
  const previewDiv = document.getElementById("jsonPreview");

  if (selectedSessionIndex === null) {
    editorDiv.innerHTML = "Vælg et pas…";
    previewDiv.innerHTML = "";
    return;
  }

  const session = plan.sessions.filter(s => s.week === selectedWeek)[selectedSessionIndex];

  editorDiv.innerHTML = `
    <label>Titel</label>
    <input id="title" value="${session.title}" />

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

    <button onclick="editSegments()">Rediger segmenter</button>
    <button onclick="autoCalc()">Beregn km/min</button>
    <button onclick="saveSession()">Gem</button>
  `;

  document.getElementById("day").value = session.day;

  previewDiv.textContent = JSON.stringify(session, null, 2);
}

/* -----------------------------------
   GEM PAS
----------------------------------- */
function saveSession() {
  const sessions = plan.sessions.filter(s => s.week === selectedWeek);
  const session = sessions[selectedSessionIndex];

  session.title = document.getElementById("title").value;
  session.day = Number(document.getElementById("day").value);
  session.note = document.getElementById("note").value;

  renderMain();
  renderEditor();
}

/* -----------------------------------
   TILFØJ NYT PAS
----------------------------------- */
function addSession() {
  plan.sessions.push({
    week: selectedWeek,
    day: 1,
    title: "Nyt pas",
    distance_km: null,
    duration_min: null,
    note: "",
    segments: []
  });

  // vælg det nyeste pas i ugen
  const sessions = plan.sessions.filter(s => s.week === selectedWeek);
  selectedSessionIndex = sessions.length - 1;

  renderMain();
  renderEditor();
}

/* -----------------------------------
   INIT
----------------------------------- */
renderLibrary();
renderWeeks();
renderMain();
