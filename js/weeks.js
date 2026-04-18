
"use strict";
/* =========================================================
   FILE: weeks.js
   PURPOSE:
   - Håndterer uge-listen i venstre panel
   - Viser uger baseret på plan.duration_weeks
   - Skift af selectedWeek og kald til renderSessionsForWeek()
   ========================================================= */

/* ============================
   DATE HELPERS (lokal tid – ingen UTC-hop)
   ============================ */

function parseISODateLocal(iso) {
  // iso = "yyyy-mm-dd"
  if (!iso || typeof iso !== "string") return null;
  const [y, m, d] = iso.split("-").map(Number);
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
  const day = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
  d.setDate(d.getDate() - day);
  return d;
}

function getISOWeekInfo(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  // Flyt til torsdag i samme uge
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const isoYear = d.getFullYear();

  const week1 = new Date(isoYear, 0, 4);
  week1.setHours(0, 0, 0, 0);

  const isoWeek =
    1 +
    Math.round(
      ((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );

  return { isoWeek, isoYear };
}

function formatDateDK(date) {
  // dd-mm (uden år)
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}`;
}

/* ============================
   WEEK LABEL
   ============================ */

function getTrainingWeekLabel(weekIndex) {
  // Hvis ingen konkurrencedato → fallback
  if (!plan.race_date) {
    return `Træningsuge ${weekIndex}`;
  }

  const raceDate = parseISODateLocal(plan.race_date);
  if (!raceDate || isNaN(raceDate.getTime())) {
    return `Træningsuge ${weekIndex}`;
  }

  const totalWeeks = Number(plan.duration_weeks || 12);

  // Sidste uge = ISO-ugen der indeholder konkurrencedatoen
  const lastWeekStart = startOfISOWeek(raceDate);

  // Uge N har offset 0, uge 1 har offset -(N-1)
  const offsetWeeks = weekIndex - totalWeeks;
  const start = addDays(lastWeekStart, offsetWeeks * 7);
  const end = addDays(start, 6);

  const { isoWeek, isoYear } = getISOWeekInfo(start);

  return `Træningsuge ${weekIndex} - Uge ${isoWeek}/${isoYear} (${formatDateDK(start)} - ${formatDateDK(end)})`;
}

/* ============================
   RENDER UGE-LISTE
   ============================ */

function renderWeeks() {
  const container = document.getElementById("weekButtons");
  if (!container) return;

  container.innerHTML = "";

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

  renderWeeks();           // flyt selected-ramme
  renderSessionsForWeek(); // renderMain + renderEditor
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

window.renderWeeks = renderWeeks;
window.selectWeek = selectWeek;
window.renderSessionsForWeek = renderSessionsForWeek;
