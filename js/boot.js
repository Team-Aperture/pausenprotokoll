/**
 * ═══════════════════════════════════════════════════════════════
 * PAUSENPROTOKOLL — BIOS
 * Team_Aperture
 *
 * KA-II's BIOS roll, re-pointed at a subsystem nobody documented.
 * It renders into whatever container it is handed, because it plays
 * in two places: on the little terminal screen while the camera is
 * still crossing the cafeteria, and full size once you have arrived.
 *
 * The first fifteen seconds have one job — make it obvious that the
 * thing on that desk is the same facility. Same cadence, same
 * terminal green, same flat refusal to find any of this odd, right
 * up until it says the word PAUSE.
 * ═══════════════════════════════════════════════════════════════
 */

const PPBoot = (() => {
  'use strict';

  const SEEN_KEY = 'pp_session_boot_seen';
  let timers = [];

  function reduced() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (_) { return false; }
  }

  const LINES = [
    { text: 'KA-II BIOS v2.4.7 // TEAM_APERTURE',         cls: 'dim',     delay: 0 },
    { text: 'Nebensystem wird geladen…',                  cls: '',        delay: 420 },
    { text: '> Sektor 7C / Kantine: VERBUNDEN',           cls: 'success', delay: 760 },
    { text: '> Personalarchiv: GEFUNDEN',                 cls: 'success', delay: 1080 },
    { text: '> Datei: PAUSENREGELUNG_07',                 cls: '',        delay: 1420 },
    { text: 'Analyse…',                                   cls: 'dim',     delay: 1800 },
    { text: '> PAUSE: ZEITLICH BEGRENZTE UNTERBRECHUNG',  cls: '',        delay: 2200 },
    { text: '>        DER ARBEITSTÄTIGKEIT',              cls: '',        delay: 2420 },
    { text: '> ZWECK: REGENERATION',                      cls: '',        delay: 2760 },
    { text: '> PRODUKTIVITÄTSSTEIGERUNG: WAHRSCHEINLICH', cls: '',        delay: 3100 },
    { text: '.',                                          cls: 'dim',     delay: 3560 },
    { text: '. .',                                        cls: 'dim',     delay: 3790 },
    { text: '. . .',                                      cls: 'dim',     delay: 4020 },
    { text: 'UNBEKANNTER PROZESS ERKANNT:',               cls: 'warn',    delay: 4460 },
    { text: 'NICHTSTUN',                                  cls: 'big',     delay: 4980 },
    { text: '> Verfahrensanweisung: NICHT VORHANDEN',     cls: 'error',   delay: 5860 },
    { text: '> Messverfahren: NICHT VORHANDEN',           cls: 'error',   delay: 6180 },
    { text: 'KALIBRIERUNG ERFORDERLICH.',                 cls: 'warn',    delay: 6680 },
    { text: 'Starte PAUSENPROTOKOLL.EXE …',               cls: 'success', delay: 7280 },
  ];

  function seenThisSession() {
    try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch (_) { return false; }
  }
  function markSeen() {
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (_) {}
  }

  /**
   * run(container, opts)
   *   opts.compact — playing on the terminal inside the scene: the
   *                  screen is small and the camera is moving, so it
   *                  runs a touch faster and keeps only the last few
   *                  lines in view.
   *   opts.onDone  — called when the last line has landed.
   */
  function run(container, opts) {
    opts = opts || {};
    stop();
    container.innerHTML = '';

    // The full roll is part of the game's personality, but only the
    // first time per browser session. Coming back gets a short resume.
    const short = seenThisSession() || reduced();
    markSeen();

    const lines = short
      ? [ { text: 'PAUSENPROTOKOLL // SITZUNG WIRD FORTGESETZT', cls: 'dim', delay: 0 },
          { text: '> Nebensystem bereit.', cls: 'success', delay: 260 } ]
      : LINES;

    const speed = opts.compact ? 0.62 : 1;   // the camera is not going to wait

    lines.forEach(l => {
      timers.push(setTimeout(() => {
        const d = document.createElement('div');
        d.className = `boot-line ${l.cls}`;
        d.textContent = l.text;
        container.appendChild(d);
        requestAnimationFrame(() => d.classList.add('visible'));
        // A small screen can only hold so much; keep the roll scrolling.
        if (opts.compact) {
          while (container.children.length > 9) container.removeChild(container.firstChild);
        }
        try {
          if (l.cls === 'big') PPAudio.klonk();   // the facility physically notices
          else PPAudio.tick();
        } catch (_) {}
      }, (reduced() ? Math.min(l.delay, 300) : l.delay) * speed));
    });

    if (opts.onDone) {
      const last = lines[lines.length - 1];
      timers.push(setTimeout(opts.onDone, (reduced() ? 400 : last.delay + 1100) * speed));
    }
    return lines.length;
  }

  function stop() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  return { run, stop, LINES };
})();

if (typeof window !== 'undefined') window.PPBoot = PPBoot;
