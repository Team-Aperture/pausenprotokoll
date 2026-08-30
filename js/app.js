/**
 * ═══════════════════════════════════════════════════════════════
 * PAUSENPROTOKOLL — BOOT, TITLE, WIRING
 * Team_Aperture
 *
 * The first fifteen seconds have one job: make it obvious that this
 * is the same facility. Same BIOS cadence, same terminal green, same
 * three typefaces, same dry refusal to acknowledge that anything odd
 * is happening — and then it says the word PAUSE and carries on as
 * if it were a reactor procedure.
 * ═══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  const BOOT_SEEN_KEY = 'pp_session_boot_seen';

  let el = {};

  function reduced() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (_) { return false; }
  }

  /* ═══ BOOT ══════════════════════════════════════════════════════
     KA-II's BIOS roll, re-pointed at a subsystem nobody documented. */
  function bootLines() {
    return [
      { text: 'KA-II BIOS v2.4.7 // TEAM_APERTURE',           cls: 'dim',     delay: 0 },
      { text: 'Nebensystem wird geladen…',                    cls: '',        delay: 420 },
      { text: '> Sektor 7C: VERBUNDEN',                       cls: 'success', delay: 760 },
      { text: '> Personalarchiv: GEFUNDEN',                   cls: 'success', delay: 1080 },
      { text: '> Datei: PAUSENREGELUNG_07',                   cls: '',        delay: 1420 },
      { text: 'Analyse…',                                     cls: 'dim',     delay: 1800 },
      { text: '> PAUSE: ZEITLICH BEGRENZTE UNTERBRECHUNG DER ARBEITSTÄTIGKEIT', cls: '', delay: 2200 },
      { text: '> ZWECK: REGENERATION',                        cls: '',        delay: 2560 },
      { text: '> PRODUKTIVITÄTSSTEIGERUNG: WAHRSCHEINLICH',   cls: '',        delay: 2900 },
      { text: '.',                                            cls: 'dim',     delay: 3400 },
      { text: '. .',                                          cls: 'dim',     delay: 3650 },
      { text: '. . .',                                        cls: 'dim',     delay: 3900 },
      { text: 'UNBEKANNTER PROZESS ERKANNT:',                 cls: 'warn',    delay: 4400 },
      { text: 'NICHTSTUN',                                    cls: 'big',     delay: 4950 },
      { text: '> Verfahrensanweisung: NICHT VORHANDEN',       cls: 'error',   delay: 5900 },
      { text: '> Messverfahren: NICHT VORHANDEN',             cls: 'error',   delay: 6250 },
      { text: 'KALIBRIERUNG ERFORDERLICH.',                   cls: 'warn',    delay: 6800 },
      { text: 'Starte PAUSENPROTOKOLL.EXE …',                 cls: 'success', delay: 7400 },
    ];
  }

  function runBoot(done) {
    const seq = document.getElementById('bootSequence');
    const skip = document.getElementById('bootSkip');

    let seen = false;
    try { seen = sessionStorage.getItem(BOOT_SEEN_KEY) === '1'; } catch (_) {}
    try { sessionStorage.setItem(BOOT_SEEN_KEY, '1'); } catch (_) {}

    // Coming back gets a short resume, and so does a player who has
    // asked for less motion. Either can be cut short at any moment.
    const lines = (seen || reduced())
      ? [ { text: 'PAUSENPROTOKOLL // SITZUNG WIRD FORTGESETZT', cls: 'dim', delay: 0 },
          { text: '> Nebensystem bereit.', cls: 'success', delay: 260 } ]
      : bootLines();

    const timers = [];
    let finished = false;

    if (lines.length > 2) skip.classList.add('visible');

    function finish() {
      if (finished) return;
      finished = true;
      skip.classList.remove('visible');
      timers.forEach(clearTimeout);
      document.removeEventListener('keydown', onKey);
      seq.removeEventListener('click', finish);
      skip.removeEventListener('click', finish);
      seq.style.transition = 'opacity .5s ease';
      seq.style.opacity = '0';
      setTimeout(() => { seq.classList.add('hidden'); done(); }, reduced() ? 0 : 500);
    }
    function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finish(); }
    }

    document.addEventListener('keydown', onKey);
    seq.addEventListener('click', finish);
    skip.addEventListener('click', finish);

    lines.forEach(l => {
      timers.push(setTimeout(() => {
        const d = document.createElement('div');
        d.className = `boot-line ${l.cls}`;
        d.textContent = l.text;
        seq.appendChild(d);
        requestAnimationFrame(() => d.classList.add('visible'));
        if (l.cls === 'big') PPAudio.klonk();       // the facility physically notices
        else PPAudio.tick();
      }, reduced() ? Math.min(l.delay, 300) : l.delay));
    });

    const last = lines[lines.length - 1];
    timers.push(setTimeout(finish, (reduced() ? 400 : last.delay + 1200)));
  }

  /* ═══ TITLE ═════════════════════════════════════════════════════ */
  function showTitle(resumeRun) {
    const card = document.getElementById('titleCard');
    const actions = document.getElementById('titleActions');
    card.classList.remove('hidden');

    actions.innerHTML = '';
    if (resumeRun && resumeRun.round > 0) {
      const cont = document.createElement('button');
      cont.type = 'button';
      cont.className = 'ka-btn primary';
      cont.textContent = '[ PAUSE FORTSETZEN ]';
      cont.addEventListener('click', () => begin(resumeRun));
      actions.appendChild(cont);

      const fresh = document.createElement('button');
      fresh.type = 'button';
      fresh.className = 'ka-btn small';
      fresh.textContent = '[ NEUE PAUSE ]';
      fresh.addEventListener('click', () => { PPState.clearRun(); begin(null); });
      actions.appendChild(fresh);
    } else {
      const start = document.createElement('button');
      start.type = 'button';
      start.className = 'ka-btn primary';
      start.textContent = '[ PAUSE BEGINNEN ]';
      start.addEventListener('click', () => begin(null));
      actions.appendChild(start);
    }

    const info = document.createElement('button');
    info.type = 'button';
    info.className = 'ka-btn small';
    info.textContent = '[ VERSUCHSHINWEISE ]';
    info.addEventListener('click', openBriefing);
    actions.appendChild(info);

    setTimeout(() => actions.querySelector('.ka-btn')?.focus(), 120);
  }

  function begin(resumeRun) {
    PPAudio.resume();
    const card = document.getElementById('titleCard');
    card.classList.add('fading');
    setTimeout(() => {
      card.classList.add('hidden');
      card.classList.remove('fading');
      document.getElementById('gameShell').classList.remove('hidden');
      PPGame.start(resumeRun);
    }, reduced() ? 0 : 800);
  }

  /* ═══ BRIEFING OVERLAY ══════════════════════════════════════════
     States the rule up front. The game is about applying it under
     pressure, not about discovering that it exists. ─────────────── */
  function openBriefing() {
    const back = document.getElementById('overlayBackdrop');
    const pane = document.getElementById('briefing');
    back.classList.remove('hidden');
    pane.classList.remove('hidden');
    setTimeout(() => document.getElementById('briefClose')?.focus(), 60);
  }
  function closeOverlay() {
    document.getElementById('overlayBackdrop').classList.add('hidden');
    document.getElementById('briefing').classList.add('hidden');
  }

  /* ═══ SOUND ═════════════════════════════════════════════════════ */
  function paintAudioBtn() {
    const b = document.getElementById('audioToggle');
    const off = PPAudio.isMuted();
    b.textContent = off ? '[ TON: AUS ]' : '[ TON: AN ]';
    b.setAttribute('aria-pressed', off ? 'true' : 'false');
  }

  /* ═══ INIT ══════════════════════════════════════════════════════ */
  function init() {
    PPState.load();
    PPDialogue.init();
    PPGame.init();

    PPAudio.setMuted(!!PPState.setting('muted'));
    paintAudioBtn();

    document.getElementById('audioToggle').addEventListener('click', () => {
      const muted = PPAudio.toggleMute();
      PPState.setting('muted', muted);
      paintAudioBtn();
    });

    document.getElementById('briefBtn').addEventListener('click', openBriefing);
    document.getElementById('briefClose').addEventListener('click', closeOverlay);
    document.getElementById('overlayBackdrop').addEventListener('click', closeOverlay);
    document.getElementById('endSkip').addEventListener('click', () => PPResults.skipEnding());

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !document.getElementById('briefing').classList.contains('hidden')) closeOverlay();
    });

    // Browsers only allow audio after a gesture; wake the context on the
    // first one, whatever it was.
    const wake = () => PPAudio.resume();
    document.addEventListener('pointerdown', wake);
    document.addEventListener('keydown', wake);

    PPResults.setReplayHandler(kind => {
      PPGame.abort();
      PPState.clearRun();
      if (kind === 'again') {
        document.getElementById('ending').classList.add('hidden');
        document.getElementById('endSkip').classList.add('hidden');
        document.getElementById('feed').innerHTML = '';
        document.getElementById('feedIdle').classList.remove('hidden');
        document.getElementById('ruleCard').classList.add('hidden');
        document.getElementById('ruleSocial').classList.add('hidden');
        document.getElementById('gameShell').classList.remove('hidden');
        PPGame.start(null);
      } else {
        location.reload();
      }
    });

    // A browser that keeps nothing is survivable — say so once, quietly.
    if (!PPState.canPersist()) {
      const n = document.getElementById('persistNote');
      if (n) n.classList.remove('hidden');
    }

    const resumeRun = PPState.getRun();
    runBoot(() => showTitle(resumeRun));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
