"use strict";
/* =========================================================
   FILE: weeks.js
   PURPOSE:
   - Håndterer uge-listen i venstre panel
   - Viser uger baseret på plan.sessions
   - Skift af selectedWeek og kald til renderSessionsForWeek()
   ========================================================= */

/* ============================
   BEREGN ANTAL UGER
   ============================ */

function getMaxWeekInPlan() {
  if (!plan.sessions || plan.sessions.length === 0) return 1;
  return Math.max(...plan.sessions.map(s => s.week || 1));
}

/* ============================
   Jeg parser datoen som lokal dato (ikke UTC), så du undgår “dato hopper en dag” problemer.
   ============================ */

function parseISODateLocal(iso) {
  // iso = "yyyy-mm-dd"
  if (!iso || typeof iso !== "string") return null;
  const parts = iso.split("-");
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d); // lokal tid
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ISO-uge starter mandag
function startOfISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun,1=Mon,...6=Sat
  const diffToMonday = (day + 6) % 7; // Mon->0, Tue->1,... Sun->6
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

function formatDateDK(date) {
  // dd-mm (uden år)
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}`;
}

/* ============================
   RENDER UGE-LISTE
   ============================ */

function renderWeeks() {
  const container = document.getElementById("weekButtons");
  if (!container) return;

  container.innerHTML = "";

  // Ugerne skal følge dropdown -> plan.duration_weeks
  const maxWeek = Number(plan.duration_weeks || 12);

  for (let w = 1; w <= maxWeek; w++) {
    const btn = document.createElement("button");
    btn.className = "week-btn";
    btn.textContent = getTrainingWeekLabel(w);

    if (w === selectedWeek) btn.classList.add("selected");

    btn.onclick = () => selectWeek(w);

    container.appendChild(btn);
  }
}

/* ============================
   VÆLG UGE
   ============================ */

function selectWeek(week) {
  selectedWeek = week;
  selectedSessionIndex = null;
  
  // ✅ vigtig: opdater ugeknappernes "selected" visuelt
  renderWeeks();

  // fortsæt som før

  renderSessionsForWeek();
}

/* ============================
   RENDER SESSIONS FOR UGE
   ============================ */

function renderSessionsForWeek() {
  const sessions = getSessionsForWeek(selectedWeek);

  if (sessions.length === 0) {
    selectedSessionIndex = null;
    renderMain();
    renderEditor();
    return;
  }

  if (selectedSessionIndex == null || selectedSessionIndex >= sessions.length) {
    selectedSessionIndex = 0;
  }

  renderMain();
  renderEditor();
}

/* ============================
   WINDOW EXPORTS
   ============================ */
/* ============================
   TILFØJ NY TRÆNINGSUGE
   ============================ */

function addWeek() {
  const maxWeek = getMaxWeekInPlan();
  const newWeek = maxWeek + 1;

  // Tilføj en tom uge (ingen pas endnu)
  plan.sessions.push({
    id: Date.now(),
    week: newWeek,
    name: "Pas 1",
    steps: []
  });

  selectedWeek = newWeek;
  selectedSessionIndex = null;

  renderWeeks();
  renderMain();
  renderEditor();
}
window.renderWeeks = renderWeeks;
window.selectWeek = selectWeek;
window.renderSessionsForWeek = renderSessionsForWeek;
window.addWeek = addWeek;

