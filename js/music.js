/**
 * ═══════════════════════════════════════════════════════════════
 * PAUSENPROTOKOLL — MUSIC
 * Team_Aperture
 *
 * One looping track, routed through the Web Audio graph so it can be
 * shaped rather than just turned up and down:
 *
 *   muffle   A lowpass. On the menu the track sounds like it is
 *            coming through the cafeteria wall; when the break
 *            actually starts, the filter opens and the room does too.
 *
 *   duck     The music drops under dialogue automatically. R-3MI's
 *            and V-TGM's chirps are quiet by design, so rather than
 *            making them louder — which would make them nag — the
 *            music gets out of their way while anyone is talking.
 *
 *   hush     The final ten seconds. The brief is explicit that
 *            silence is gameplay there, so the track leaves entirely
 *            and comes back for the results.
 *
 * Browsers will not start audio before a gesture. Playback is
 * attempted immediately and re-attempted on the first interaction, so
 * whichever comes first, the music starts without the player having
 * to do anything special.
 * ═══════════════════════════════════════════════════════════════
 */

const PPMusic = (() => {
  'use strict';

  const SRC = 'assets/music/the-roost-remix.mp3';

  // Quiet enough to sit under a conversation held by two small robots.
  const VOL_FULL   = 0.34;
  const VOL_DUCKED = 0.13;
  const CUT_MUFFLED = 380;     // Hz — through a wall
  const CUT_OPEN    = 16000;   // Hz — in the room

  let audioEl = null, node = null, filter = null, gain = null;
  let started = false, wanted = false, ducked = false, hushed = false;
  let muffled = true;

  function ctx() { return PPAudio.ensureCtx(); }

  function build() {
    if (node) return true;
    const c = ctx();
    if (!c || !audioEl) return false;
    try {
      node   = c.createMediaElementSource(audioEl);
      filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = muffled ? CUT_MUFFLED : CUT_OPEN;
      filter.Q.value = 0.7;
      gain = c.createGain();
      gain.gain.value = 0;
      node.connect(filter).connect(gain).connect(c.destination);
      return true;
    } catch (_) { node = null; return false; }
  }

  function ramp(param, to, seconds) {
    const c = ctx();
    if (!c || !param) return;
    try {
      const t = c.currentTime;
      param.cancelScheduledValues(t);
      param.setValueAtTime(param.value, t);
      param.linearRampToValueAtTime(to, t + (seconds || 1));
    } catch (_) {}
  }

  function targetVolume() {
    if (PPAudio.isMuted() || hushed) return 0;
    return ducked ? VOL_DUCKED : VOL_FULL;
  }
  function applyVolume(seconds) { if (gain) ramp(gain.gain, targetVolume(), seconds || 0.8); }

  function init() {
    audioEl = new Audio();
    audioEl.src = SRC;
    audioEl.loop = true;
    audioEl.preload = 'none';       // never hold up the menu
    audioEl.crossOrigin = 'anonymous';
    audioEl.addEventListener('error', () => { wanted = false; }, { once: true });
  }

  /* Ask for playback. Safe to call repeatedly — the first gesture that
     lets it through is the one that wins. */
  function start() {
    wanted = true;
    if (!audioEl) init();
    if (!build()) return;
    if (started) { applyVolume(1.4); return; }
    const p = audioEl.play();
    if (p && p.catch) {
      p.then(() => { started = true; applyVolume(2.2); })
       .catch(() => { /* blocked — a later gesture will retry */ });
    } else { started = true; applyVolume(2.2); }
  }

  /* Called on user gestures, in case autoplay was refused earlier. */
  function retry() { if (wanted && !started) start(); }

  function setMuffled(on, seconds) {
    muffled = !!on;
    if (filter) ramp(filter.frequency, muffled ? CUT_MUFFLED : CUT_OPEN, seconds || 1.6);
  }

  /* Someone is talking. */
  function duck(on) {
    if (ducked === !!on) return;
    ducked = !!on;
    applyVolume(ducked ? 0.35 : 1.1);
  }

  /* The final calibration. Real silence, then back. */
  function hush(on, seconds) {
    hushed = !!on;
    applyVolume(seconds || (hushed ? 2.4 : 1.6));
  }

  function stop(seconds) {
    wanted = false;
    applyVolume(seconds || 1.2);
    setTimeout(() => { try { audioEl && audioEl.pause(); started = false; } catch (_) {} },
               (seconds || 1.2) * 1000 + 80);
  }

  /* The global sound switch owns everything. */
  function applyMute() { applyVolume(0.3); }

  /* What the track is actually doing. The element is created with
     `new Audio()` and never enters the DOM, so this is the only way to
     see it — from the console, or from a test. */
  function status() {
    return {
      playing: !!(audioEl && !audioEl.paused),
      time:    audioEl ? +audioEl.currentTime.toFixed(2) : null,
      loop:    audioEl ? audioEl.loop : null,
      cutoff:  filter ? Math.round(filter.frequency.value) : null,
      volume:  gain ? +gain.gain.value.toFixed(3) : null,
      muffled, ducked, hushed, started,
    };
  }

  return { init, start, retry, setMuffled, duck, hush, stop, applyMute, status };
})();

if (typeof window !== 'undefined') window.PPMusic = PPMusic;
