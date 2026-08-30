/**
 * ═══════════════════════════════════════════════════════════════
 * PAUSENPROTOKOLL — LOCAL STATE
 * Team_Aperture
 *
 * Deliberately small. Pausenprotokoll is a fifteen-minute side
 * protocol, so it does not get KA-II's save system: no schema
 * migrations, no portable codes, no progression invariants, and no
 * connection whatsoever to the KA-II main save. It keeps three
 * things:
 *
 *   settings  — the sound switch, so it survives a reload
 *   run       — where a run had got to, so a refresh does not
 *               throw the whole break away
 *   awards    — the handful of things worth remembering between runs
 *
 * A run is remembered at ROUND boundaries only. Resuming drops the
 * player at the start of the round they were in, which is honest:
 * the alternative is restoring a half-finished round with three
 * messages mid-flight, which would be both fiddly and unfair.
 *
 * A browser that refuses to store anything is survivable. Everything
 * below degrades to an in-memory object and the game plays fine.
 * ═══════════════════════════════════════════════════════════════
 */

const PPState = (() => {
  'use strict';

  const KEY = 'pp_state_v1';

  const defaults = () => ({
    settings: { muted: false },
    run:      null,          // { round, stability, stats } or null
    awards:   [],            // ids of awards earned in any run
    plays:    0,
  });

  let data = defaults();
  let persists = true;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          data = { ...defaults(), ...parsed };
          // shapes, in case something hand-edited the key
          if (!data.settings || typeof data.settings !== 'object') data.settings = { muted: false };
          if (!Array.isArray(data.awards)) data.awards = [];
          if (typeof data.plays !== 'number') data.plays = 0;
        }
      }
    } catch (_) { /* unreadable or blocked — carry on with defaults */ }

    // Does this browser actually keep anything?
    try {
      localStorage.setItem(KEY + '_probe', '1');
      localStorage.removeItem(KEY + '_probe');
    } catch (_) { persists = false; }

    return data;
  }

  function save() {
    if (!persists) return;
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (_) { persists = false; }
  }

  /* ── settings ───────────────────────────────────────────────── */
  function setting(k, v) {
    if (v === undefined) return data.settings[k];
    data.settings[k] = v;
    save();
    return v;
  }

  /* ── run ────────────────────────────────────────────────────── */
  function saveRun(run) { data.run = run; save(); }
  function getRun()     { return data.run; }
  function clearRun()   { data.run = null; save(); }

  function countPlay()  { data.plays = (data.plays || 0) + 1; save(); return data.plays; }
  function plays()      { return data.plays || 0; }

  /* ── awards ─────────────────────────────────────────────────── */
  function grant(id) {
    if (data.awards.indexOf(id) >= 0) return false;
    data.awards.push(id);
    save();
    return true;                 // true = newly earned
  }
  function hasAward(id) { return data.awards.indexOf(id) >= 0; }
  function awards()     { return data.awards.slice(); }

  function canPersist() { return persists; }

  return {
    load, save, setting,
    saveRun, getRun, clearRun,
    countPlay, plays,
    grant, hasAward, awards,
    canPersist,
  };
})();

if (typeof window !== 'undefined') window.PPState = PPState;
