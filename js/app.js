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

  /* ═══ MAIN MENU ═════════════════════════════════════════════════
     The menu is the room. The buttons sit over it; the camera drifts
     behind them until one is pressed. ─────────────────────────────── */
  function showMenu(resumeRun) {
    const actions = document.getElementById('cafActions');
    actions.innerHTML = '';

    const add = (label, cls, fn) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'caf-btn ' + cls;
      b.textContent = label;
      b.addEventListener('click', fn);
      actions.appendChild(b);
      return b;
    };

    if (resumeRun && resumeRun.round > 0) {
      add('[ PAUSE FORTSETZEN ]', 'primary', () => begin(resumeRun));
      add('[ NEUE PAUSE ]', 'small', () => { PPState.clearRun(); begin(null); });
    } else {
      add('[ PAUSE BEGINNEN ]', 'primary', () => begin(null));
    }
    add('[ VERSUCHSHINWEISE ]', 'small', openBriefing);

    setTimeout(() => actions.querySelector('.caf-btn')?.focus(), 900);
  }

  /* Hear why the break is happening, then fly into the terminal.
     Resuming an interrupted run skips the explanation — you have
     already had it. */
  function begin(resumeRun) {
    PPAudio.resume();
    PPAudio.hum.start();          // the room has been humming all along
    PPMusic.start();

    const fly = () => PPCafeteria.approach(() => {
      document.getElementById('gameShell').classList.remove('hidden');
      PPGame.start(resumeRun);
    });

    if (resumeRun && resumeRun.round > 0) {
      PPCafeteria.playIntro(null);
      PPDialogue.silence();
      PPMusic.setMuffled(false, 1.4);
      fly();
    } else {
      PPCafeteria.playIntro(fly);
    }
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
  /* The sound switch exists in two places — on the menu and on the
     terminal's own bar — but it is one setting, so both are painted
     from the same state and either can flip it. */
  function paintAudioBtn() {
    const off = PPAudio.isMuted();
    document.querySelectorAll('.js-audio').forEach(b => {
      b.textContent = off ? '[ TON: AUS ]' : '[ TON: AN ]';
      b.setAttribute('aria-pressed', off ? 'true' : 'false');
    });
  }

  /* ═══ INIT ══════════════════════════════════════════════════════ */
  function init() {
    PPState.load();
    PPDialogue.init();
    PPGame.init();

    PPMusic.init();
    PPAudio.setMuted(!!PPState.setting('muted'));
    paintAudioBtn();

    // The menu hears the track through the wall; starting the break
    // opens the filter up.
    PPMusic.setMuffled(true, 0);
    PPMusic.start();

    document.querySelectorAll('.js-audio').forEach(b => b.addEventListener('click', () => {
      const muted = PPAudio.toggleMute();
      PPState.setting('muted', muted);
      paintAudioBtn();
    }));

    document.getElementById('briefBtn').addEventListener('click', openBriefing);
    document.getElementById('briefClose').addEventListener('click', closeOverlay);
    document.getElementById('overlayBackdrop').addEventListener('click', closeOverlay);
    document.getElementById('endSkip').addEventListener('click', () => PPResults.skipEnding());

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !document.getElementById('briefing').classList.contains('hidden')) closeOverlay();
    });

    // Browsers only allow audio after a gesture; wake the context on the
    // first one, whatever it was.
    const wake = () => { PPAudio.resume(); PPMusic.retry(); };
    document.addEventListener('pointerdown', wake);
    document.addEventListener('keydown', wake);

    PPResults.setReplayHandler(kind => {
      PPGame.abort();
      PPState.clearRun();
      document.getElementById('ending').classList.add('hidden');
      document.getElementById('endSkip').classList.add('hidden');
      document.getElementById('feed').innerHTML = '';
      document.getElementById('feedIdle').classList.remove('hidden');
      document.getElementById('ruleCard').classList.add('hidden');
      document.getElementById('ruleSocial').classList.add('hidden');

      if (kind === 'again') {
        // Straight back into the chair — no second trip across the room.
        document.getElementById('gameShell').classList.remove('hidden');
        PPGame.start(null);
      } else {
        // Back out to the cafeteria, and the menu rebuilds itself.
        document.getElementById('gameShell').classList.add('hidden');
        PPAudio.hum.stop();
        PPMusic.hush(false, 1.2);
        PPMusic.setMuffled(true, 1.6);   // back behind the wall
        PPCafeteria.reset();
        showMenu(null);
      }
    });

    // A browser that keeps nothing is survivable — say so once, quietly.
    if (!PPState.canPersist()) {
      const n = document.getElementById('persistNote');
      if (n) n.classList.remove('hidden');
    }

    PPCafeteria.init();
    PPCafeteria.startDrift();
    showMenu(PPState.getRun());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
