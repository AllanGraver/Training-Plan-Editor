"use strict";
/* =========================================================
   FILE: autocalc.js
   PURPOSE:
   - Automatisk beregning af distance og varighed
   - Bruger segments på et session-objekt
   ========================================================= */

function autoCalc() {
  const session = plan.sessions.filter(s => s.week === selectedWeek)[selectedSessionIndex];
  if (!session || !session.segments) return;

  let totalKm = 0;
  let totalMin = 0;

  session.segments.forEach(seg => {
    if (seg.distance_km) totalKm += seg.distance_km;
    if (seg.duration_min) totalMin += seg.duration_min;

    if (seg.steps) {
      seg.steps.forEach(step => {
        if (step.duration_min) totalMin += step.duration_min;
      });
    }

    if (seg.repetitions && seg.steps) {
      let blockMin = seg.steps.reduce((sum, s) => sum + (s.duration_min || 0), 0);
      totalMin += blockMin * (seg.repetitions - 1);
    }
  });

  session.distance_km = Number(totalKm.toFixed(1));
  session.duration_min = Math.round(totalMin);

  renderMain();
  renderEditor();
}

/* ============================
   WINDOW EXPORT
   ============================ */

window.autoCalc = autoCalc;
