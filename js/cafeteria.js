/**
 * ═══════════════════════════════════════════════════════════════
 * PAUSENPROTOKOLL — THE CAMERA
 * Team_Aperture
 *
 * Two movements, both driven here rather than in CSS keyframes so the
 * second can start from wherever the first happens to be:
 *
 *   drift()    the slow horizontal pan across the cafeteria that
 *              plays under the main menu. Eases back and forth so it
 *              never hits a wall and snaps.
 *
 *   approach() the push-in. Measures where the terminal's screen
 *              actually is on the viewport right now and solves for
 *              the camera transform that lands it dead centre and
 *              oversized. Because it is measured rather than
 *              hard-coded, it stays correct at any window size.
 *
 * The game UI is never scaled. At the top of the push-in the real
 * (unscaled, crisp) monitor frame cross-fades in over the zoomed
 * scene — the swap happens at the moment both images match, so it
 * reads as one continuous move.
 * ═══════════════════════════════════════════════════════════════
 */

const PPCafeteria = (() => {
  'use strict';

  const DRIFT_SECONDS   = 54;    // one full sweep of the room
  const APPROACH_MS     = 2600;
  const BOOT_AT         = 300;   // BIOS starts this far into the approach
  const HANDOVER_AT     = 0.80;  // fraction of the approach where the deck fades in

  let el = {};
  let driftRaf = null, driftStart = 0, driftPaused = false;
  let panRange = 0;

  function reduced() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (_) { return false; }
  }

  function init() {
    el.stage   = document.getElementById('cafStage');
    el.camera  = document.getElementById('cafCamera');
    el.world   = document.getElementById('cafWorld');
    el.menu    = document.getElementById('cafMenu');
    el.term    = document.getElementById('cafTermScreen');
    el.idle    = document.getElementById('cafTermIdle');
    el.boot    = document.getElementById('cafTermBoot');
    el.deck    = document.getElementById('deck');
    scatterMotes();
    measure();
    window.addEventListener('resize', measure);
  }

  /* Dust needs to look scattered, not authored. */
  function scatterMotes() {
    const box = document.getElementById('cafMotes');
    if (!box || reduced()) return;
    let html = '';
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * 100, y = 40 + Math.random() * 55;
      html += `<i style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;
                 animation-delay:${(-Math.random() * 19).toFixed(2)}s;
                 animation-duration:${(15 + Math.random() * 12).toFixed(1)}s"></i>`;
    }
    box.innerHTML = html;
  }

  function measure() {
    if (!el.world) return;
    panRange = Math.max(0, el.world.offsetWidth - window.innerWidth);
  }

  /* ─── THE DRIFT ───────────────────────────────────────────────
     A cosine sweep between the two ends of the room. It starts part
     way along so the terminal is not the first thing you see — the
     room introduces itself, and the thing you are about to climb
     into arrives on its own. */
  function startDrift() {
    if (reduced()) {                       // no motion: settle on a good framing
      el.world.style.transform = `translateX(${-panRange * 0.52}px)`;
      return;
    }
    driftStart = performance.now();
    const loop = (t) => {
      if (!driftPaused) {
        const phase = ((t - driftStart) / 1000) / DRIFT_SECONDS;
        // 0..1..0 with eased ends, offset so we begin mid-room
        const k = (1 - Math.cos((phase + 0.28) * Math.PI * 2)) / 2;
        el.world.style.transform = `translateX(${-panRange * (0.12 + k * 0.76)}px)`;
      }
      driftRaf = requestAnimationFrame(loop);
    };
    driftRaf = requestAnimationFrame(loop);
  }

  function stopDrift() {
    driftPaused = true;
    if (driftRaf) cancelAnimationFrame(driftRaf);
    driftRaf = null;
  }

  /* ─── THE PUSH-IN ─────────────────────────────────────────────
     Solve for the camera that puts the terminal screen in the middle
     of the viewport at `fill` times its width. With transform-origin
     at 0 0 a point p maps to s·p + t, so centring the screen is just:
        t = viewportCentre − s · screenCentre
     Measured live, so it is right on a phone and on an ultrawide. */
  function approach(onArrived) {
    const done = () => { finish(onArrived); };

    if (reduced()) {                        // no flight: cut straight in
      el.menu.classList.add('leaving');
      showBoot();
      setTimeout(done, 700);
      return;
    }

    stopDrift();
    el.menu.classList.add('leaving');
    el.stage.classList.add('approaching');

    const r  = el.term.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    // Overshoot past the bezel so the screen more than fills the frame
    // by the time the real deck takes over.
    const s  = Math.max((vw / r.width) * 1.25, (vh / r.height) * 1.25);
    const tx = vw / 2 - s * (r.left + r.width / 2);
    const ty = vh / 2 - s * (r.top + r.height / 2);

    el.camera.style.transition = `transform ${APPROACH_MS}ms cubic-bezier(0.55, 0, 0.30, 1)`;
    // next frame, so the transition has a start value to move from
    requestAnimationFrame(() => {
      el.camera.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    });

    setTimeout(showBoot, BOOT_AT);
    setTimeout(done, APPROACH_MS * HANDOVER_AT);
  }

  /* The BIOS runs on the little screen while the camera is still on
     its way, so by the time you arrive the facility is already awake. */
  function showBoot() {
    el.idle.style.transition = 'opacity .4s ease';
    el.idle.style.opacity = '0';
    el.boot.classList.add('on');
    PPBoot.run(el.boot, { compact: true });
  }

  /* Hand over to the real, unscaled monitor and put the room to bed. */
  function finish(onArrived) {
    el.deck.classList.add('on');
    if (onArrived) onArrived();
    // The scene has done its job; stop it painting behind the deck.
    setTimeout(() => {
      el.stage.classList.add('gone');
      PPBoot.stop();
    }, 900);
  }

  /* Coming back to the menu after a run: rebuild the room. */
  function reset() {
    el.deck.classList.remove('on');
    el.stage.classList.remove('gone', 'approaching');
    el.menu.classList.remove('leaving');
    el.camera.style.transition = 'none';
    el.camera.style.transform = 'none';
    el.boot.classList.remove('on');
    el.boot.innerHTML = '';
    el.idle.style.opacity = '';
    driftPaused = false;
    measure();
    startDrift();
  }

  return { init, startDrift, stopDrift, approach, reset };
})();

if (typeof window !== 'undefined') window.PPCafeteria = PPCafeteria;
