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
    add('[ ERFOLGE ]', 'small', openAwards);

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
    document.getElementById('awards').classList.add('hidden');
  }

  /* ═══ ERFOLGE ══════════════════════════════════════════════════
     Built from the same list the results screen scores against, so
     the two can never drift apart. A locked entry still names itself
     and what it is for — the point is to tell the player what is
     worth trying, not to hide it behind a question mark. ────────── */
  function openAwards() {
    const list = document.getElementById('awardList');
    const have = PPState.awards();
    const all  = PPResults.AWARDS;

    list.innerHTML = '';
    all.forEach(a => {
      const got = have.indexOf(a.id) >= 0;
      const li = document.createElement('li');
      li.className = 'award-item' + (got ? ' got' : '');
      li.innerHTML =
        `<span class="aw-mark" aria-hidden="true">${got ? '✓' : '·'}</span>` +
        `<span class="aw-body"><span class="aw-name"></span><span class="aw-desc"></span></span>`;
      li.querySelector('.aw-name').textContent = a.name;
      li.querySelector('.aw-desc').textContent = a.desc;
      // Not colour alone: the state is in the text too.
      li.setAttribute('aria-label', `${a.name}. ${a.desc} ${got ? 'Erreicht.' : 'Noch offen.'}`);
      list.appendChild(li);
    });

    const count = document.getElementById('awardsCount');
    count.textContent = `${have.filter(id => all.some(a => a.id === id)).length} von ${all.length} · ${PPState.plays()} ${PPState.plays() === 1 ? 'Pause' : 'Pausen'} absolviert`;

    document.getElementById('overlayBackdrop').classList.remove('hidden');
    document.getElementById('awards').classList.remove('hidden');
    setTimeout(() => document.getElementById('awardsClose')?.focus(), 60);
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

  /* Keep --screen-inset in step with the monitor. */
  function publishScreenInset() {
    const screen = document.getElementById('deckScreen');
    if (!screen) return;
    const apply = () => {
      const r = screen.getBoundingClientRect();
      if (!r.width) return;
      const inset = `${Math.round(r.top)}px ${Math.round(window.innerWidth - r.right)}px `
                  + `${Math.round(window.innerHeight - r.bottom)}px ${Math.round(r.left)}px`;
      document.documentElement.style.setProperty('--screen-inset', inset);
    };
    apply();
    try { new ResizeObserver(apply).observe(screen); } catch (_) {}
    window.addEventListener('resize', apply);
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
    document.getElementById('awardsClose').addEventListener('click', closeOverlay);
    document.getElementById('overlayBackdrop').addEventListener('click', closeOverlay);
    document.getElementById('endSkip').addEventListener('click', () => {
      const st = PPGame.stateFor();
      PPResults.skipEnding(st.stats?.poweredOff,
                           PPResults.rankFor(Math.round(st.stability), st.stats));
    });

    // The little green lamp on the monitor's plate is a switch.
    PPPower.init(() => PPGame.poweredOff());

    // The results and the ending live outside the monitor but should
    // look like they are on it, so they are clipped to its measured
    // rectangle. Measured rather than guessed: the housing is sized in
    // vmin and clamps, so nothing else would stay aligned.
    publishScreenInset();

    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const open = !document.getElementById('briefing').classList.contains('hidden')
                || !document.getElementById('awards').classList.contains('hidden');
      if (open) closeOverlay();
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
      PPPower.reset();                 // the monitor comes back on

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
