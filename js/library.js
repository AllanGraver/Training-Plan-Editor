"use strict";
/* =========================================================
   FILE: library.js
   PURPOSE:
   - Håndterer plan-bibliotek i localStorage
   - Opret, gem, gem som, indlæs, import/eksport planer
   - Renderer plan-listen i venstre sidebar
   ========================================================= */

/* ============================
   LOCAL STORAGE
   ============================ */

function loadLibrary() {
  const raw = localStorage.getItem("training_plans_library");
  return raw ? JSON.parse(raw) : {};
}

function saveLibrary(lib) {
  localStorage.setItem("training_plans_library", JSON.stringify(lib));
}

/* ============================
   RENDER PLAN-LISTE
   ============================ */

function renderLibrary() {
  const lib = loadLibrary();
  const div = document.getElementById("planList");
  if (!div) return;

  div.innerHTML = "";

  Object.keys(lib).forEach(name => {
    const row = document.createElement("div");
    row.className = "plan-item-row";

    const item = document.createElement("div");
    item.className = "plan-item";
    item.textContent = name;

    if (plan && plan.plan_name === name) {
      item.classList.add("selected");
    }

    item.onclick = () => loadPlan(name);

    const del = document.createElement("span");
    del.className = "delete-plan";
    del.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round"
           stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6l-1 14H6L5 6"></path>
        <path d="M10 11v6"></path>
        <path d="M14 11v6"></path>
        <path d="M9 6V4h6v2"></path>
      </svg>
    `;

    del.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Slet planen "${name}"?`)) {
        delete lib[name];
        saveLibrary(lib);

        if (plan.plan_name === name) {
          plan = {
            plan_name: "Ny plan",
            duration_weeks: 12,
            race_distance_km: null,
            sessions: []
          };
          selectedWeek = 1;
          selectedSessionIndex = null;
          renderWeeks();
          renderMain();
          renderEditor();
        }

        renderLibrary();
      }
    };

    row.appendChild(item);
    row.appendChild(del);
    div.appendChild(row);
  });
}

/* ============================
   OPRET NY PLAN
   ============================ */

function newPlan() {
  const name = prompt("Navn på den nye træningsplan:");
  if (!name) return;

  // Ny plan med 1 uge og 1 standard-pas i uge 1
  const firstSession = {
    id: Date.now(),
    week: 1,
    name: "Pas 1",
    steps: [
      {
        type: "warmup",
        durationType: "time",
        hours: 0,
        minutes: 5,
        seconds: 0,
        notes: "",
        intensity: "E"
      },
      {
        type: "run",
        mode: "simple",
        durationType: "distance",
        distance: 1,
        notes: "",
        intensity: "T"
      },
      {
        type: "cooldown",
        durationType: "time",
        hours: 0,
        minutes: 5,
        seconds: 0,
        notes: "",
        intensity: "E"
      }
    ]
  };

  plan = {
    plan_name: name,
    duration_weeks: 12,
    race_distance_km: null,
    sessions: [firstSession]
  };

  const lib = loadLibrary();
  lib[name] = plan;
  saveLibrary(lib);

  selectedWeek = 1;
  selectedSessionIndex = 0;

  renderLibrary();
  renderWeeks();
  renderMain();
  renderEditor();
}

/* ============================
   GEM PLAN
   ============================ */

function savePlan() {
  const name = plan.plan_name || prompt("Navn på træningsplanen:");
  if (!name) return;

  plan.plan_name = name;

  const lib = loadLibrary();
  lib[name] = plan;
  saveLibrary(lib);

  renderLibrary();
}

/* ============================
   GEM SOM
   ============================ */

function savePlanAs() {
  if (!window.plan) {
    alert("Der er ingen aktiv plan at gemme endnu.");
    return;
  }

  const name = prompt("Navn på ny træningsplan:", plan.plan_name || "");
  if (!name) return;

  // lav en dyb kopi, så biblioteket ikke deler reference
  const copy = JSON.parse(JSON.stringify(plan));
  copy.plan_name = name;

  const lib = loadLibrary();
  lib[name] = copy;
  saveLibrary(lib);

  loadPlan(name);
}

/* ============================
   INDLÆS PLAN
   ============================ */

function loadPlan(name) {
  const lib = loadLibrary();
  plan = JSON.parse(JSON.stringify(lib[name]));

  plan.sessions.forEach(s => {
    if (!Array.isArray(s.steps)) s.steps = [];
  });

  selectedWeek = 1;
  selectedSessionIndex = null;

  renderLibrary();
  renderWeeks();
  renderMain();
  renderEditor();
}


/* ============================
   EXPORT HELPERS
   ============================ */

// true hvis der er valgt konkurrencedato i <input id="raceDateInput">
function hasRaceDateSelected() {
  const el = document.getElementById("raceDateInput");
  return !!(el && el.value);
}

function sanitizeFilename(name) {
  const base = (name || "training-plan").toString().trim();
  return (base.replace(/[<>:"/\\|?*\x00-\x1F]/g, "") || "training-plan").trim();
}

function downloadTextFile(text, filename, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


/* ============================
   EKSPORT / IMPORT
   ============================ */


function exportPlanJSON() {
  // ✅ JSON eksport må KUN køre når der IKKE er valgt konkurrencedato
  if (hasRaceDateSelected()) {
    alert("JSON eksport er kun muligt når der IKKE er valgt en konkurrencedato.\n\nFjern konkurrencedatoen for at eksportere JSON.");
    return;
  }

  const data = JSON.stringify(plan, null, 2);
  const filename = sanitizeFilename(plan.plan_name) + ".json";
  downloadTextFile(data, filename, "application/json;charset=utf-8");
}

/* ---------- iCal / ICS export ---------- */

function pad2(n) { return String(n).padStart(2, "0"); }
function toICSDate(d) { return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`; }

function toICSDtStampUTC(date = new Date()) {
  return (
    date.getUTCFullYear() +
    pad2(date.getUTCMonth() + 1) +
    pad2(date.getUTCDate()) + "T" +
    pad2(date.getUTCHours()) +
    pad2(date.getUTCMinutes()) +
    pad2(date.getUTCSeconds()) + "Z"
  );
}

function escapeICSText(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Beregn mandag i uge 1 ud fra konkurrencedato og antal uger
function computeWeek1Monday(raceDate, durationWeeks) {
  const dayOfWeek = raceDate.getDay(); // 0=søndag, 1=mandag, ...
  const mondayOffset = (dayOfWeek === 0) ? -6 : (1 - dayOfWeek);
  const raceWeekMonday = addDays(raceDate, mondayOffset);
  return addDays(raceWeekMonday, -7 * (durationWeeks - 1));
}

// Find day (1..7) i en session. Falder tilbage til 1 (mandag) hvis ikke den findes.
function getSessionDay1to7(session) {
  // Hvis du gemmer day som 1..7
  if (typeof session.day === "number") return session.day;

  // Hvis du gemmer dayIndex som 0..6 (mandag=0)
  if (typeof session.dayIndex === "number") return session.dayIndex + 1;

  // Hvis du gemmer en streng (fx "Mandag")
  const s = (session.dayName || session.weekday || session.ugedag || "").toString().trim().toLowerCase();
  const map = {
    mandag: 1, tirsdag: 2, onsdag: 3, torsdag: 4, fredag: 5, lørdag: 6, loerdag: 6, søndag: 7, soendag: 7,
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7
  };
  return map[s] || 1;
}

function exportPlanICal() {
  // ✅ iCal eksport må KUN køre når der ER valgt konkurrencedato
  if (!hasRaceDateSelected()) {
    alert("iCal eksport kræver at du vælger en konkurrencedato først.");
    return;
  }

  const raceDateStr = document.getElementById("raceDateInput").value; // yyyy-mm-dd
  const raceDate = new Date(raceDateStr + "T00:00:00");

  const durationWeeks = Number(plan.duration_weeks || 0);
  if (!durationWeeks) {
    alert("iCal eksport kræver at planen har et gyldigt antal træningsuger (duration_weeks).");
    return;
  }

  const week1Monday = computeWeek1Monday(raceDate, durationWeeks);
  const dtstamp = toICSDtStampUTC(new Date());
  const prodId = "-//Training Plan Editor//DA";
  const uidBase = sanitizeFilename(plan.plan_name).toLowerCase().replace(/\s+/g, "-");

  // Sortér sessions efter uge og dag (hvis dag findes)
  const sessions = Array.isArray(plan.sessions) ? [...plan.sessions] : [];
  sessions.sort((a, b) => (Number(a.week || 1) - Number(b.week || 1)) || (getSessionDay1to7(a) - getSessionDay1to7(b)));

  let counter = 0;
  const vevents = [];

  sessions.forEach((s) => {
    counter++;

    const week = Number(s.week || 1);
    const day = getSessionDay1to7(s); // 1..7
    const sessionDate = addDays(week1Monday, (week - 1) * 7 + (day - 1));

    // All-day event: DTEND skal være næste dag
    const dtStart = toICSDate(sessionDate);
    const dtEnd = toICSDate(addDays(sessionDate, 1));

    const title = s.title || s.name || `Træningspas ${counter}`;
    const summary = `Uge ${week} - ${title}`;

    // Beskrivelse: brug evt. notes i steps, eller bare list steps-typer
    let desc = "";
    if (Array.isArray(s.steps) && s.steps.length) {
      const lines = s.steps.map((st, i) => {
        const t = st.type || "step";
        const note = st.notes ? ` – ${st.notes}` : "";
        return `${i + 1}. ${t}${note}`;
      });
      desc = lines.join("\\n");
    }

    const uid = `${uidBase}-${week}-${day}-${dtStart}@training-plan-editor`;

    vevents.push([
      "BEGIN:VEVENT",
      `UID:${escapeICSText(uid)}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${escapeICSText(summary)}`,
      desc ? `DESCRIPTION:${escapeICSText(desc)}` : null,
      "END:VEVENT"
    ].filter(Boolean).join("\r\n"));
  });

  if (!vevents.length) {
    alert("Der er ingen træningspas i planen at eksportere til iCal.");
    return;
  }

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${prodId}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...vevents,
    "END:VCALENDAR",
    ""
  ].join("\r\n");

  const filename = sanitizeFilename(plan.plan_name) + ".ics";
  downloadTextFile(ics, filename, "text/calendar;charset=utf-8");
}


function importPlan() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const imported = JSON.parse(reader.result);
      const fileName = file.name.replace(/\.json$/i, "");
      imported.plan_name = fileName;

      imported.sessions.forEach(s => {
        if (!Array.isArray(s.steps)) s.steps = [];
      });

      const lib = loadLibrary();
      lib[fileName] = imported;
      saveLibrary(lib);

      loadPlan(fileName);
    };

    reader.readAsText(file);
  };

  input.click();
}

/* ============================
   WINDOW EXPORTS
   ============================ */

window.renderLibrary = renderLibrary;
window.newPlan = newPlan;
window.savePlan = savePlan;
window.savePlanAs = savePlanAs;
window.loadPlan = loadPlan;
window.exportPlanJSON = exportPlanJSON;
window.exportPlanICal = exportPlanICal;
window.importPlan = importPlan;
window.loadLibrary = loadLibrary;
window.saveLibrary = saveLibrary;
