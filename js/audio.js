/**
 * ═══════════════════════════════════════════════════════════════
 * PAUSENPROTOKOLL — AUDIO
 * Team_Aperture
 *
 * Same architecture as KA-II's engine: procedural Web Audio, no
 * files, one global mute that is remembered. Nothing here is ever
 * required to solve anything — every distinction the ear can make
 * is also written on the screen.
 *
 * Two additions this subsystem needs:
 *
 *   hum    — a quiet facility drone that can be faded to NOTHING.
 *            A game about a break has to be able to go actually
 *            silent, and it does, for the final calibration.
 *
 *   klonk  — reserved. KLONK means something physical in the
 *            facility moved. A button that only changes the screen
 *            gets a click; a cup that is actually secured gets a
 *            KLONK. Do not spend it on UI.
 * ═══════════════════════════════════════════════════════════════
 */

const PPAudio = (() => {
  'use strict';

  let ctx = null, master = null, muted = false;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch (_) { ctx = null; }
    return ctx;
  }

  function resume() {
    const c = ensure();
    if (c && c.state === 'suspended') c.resume();
  }

  function tone(o) {
    if (muted) return;
    const c = ensure(); if (!c) return;
    const { freq = 440, type = 'sine', dur = 0.08, vol = 0.25, glideTo = null, delay = 0 } = o || {};
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /* ── Speech chirps. Same voices as KA-II, so the two units sound
        like themselves. ─────────────────────────────────────────── */
  const VOICE = {
    'R-3MI':  { base: 520, type: 'square',   spread: 70, vol: 0.10 },
    'V-TGM':  { base: 340, type: 'triangle', spread: 90, vol: 0.17 },
    'SYSTEM': { base: 300, type: 'triangle', spread: 0,  vol: 0.09 },
  };
  function blip(speaker) {
    const v = VOICE[speaker] || VOICE['SYSTEM'];
    tone({
      freq: v.base + (Math.random() * 2 - 1) * v.spread,
      type: v.type, dur: 0.045, vol: v.vol,
    });
  }

  /* ── UI ─────────────────────────────────────────────────────── */
  function click() { tone({ freq: 660, type: 'square', dur: 0.025, vol: 0.10 }); }

  /* A message arriving. Flat, single, unremarkable — the sound the
     facility makes about a thousand things a day. */
  function notify() { tone({ freq: 880, type: 'sine', dur: 0.07, vol: 0.11 }); }

  /* A loud message arriving. Louder, not more important. */
  function alarm() {
    tone({ freq: 620, type: 'sawtooth', dur: 0.11, vol: 0.13 });
    tone({ freq: 620, type: 'sawtooth', dur: 0.11, vol: 0.13, delay: 0.17 });
  }

  /* A maintenance code arriving. A rising two-tone the ear can learn —
     but the M-code is written on the card, so the ear never has to. */
  function maintenance() {
    tone({ freq: 392, type: 'triangle', dur: 0.10, vol: 0.15 });
    tone({ freq: 587, type: 'triangle', dur: 0.16, vol: 0.15, delay: 0.12 });
  }

  /* ── Outcomes ───────────────────────────────────────────────── */
  function good()  { [523, 784].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.16, vol: 0.15, delay: i * 0.09 })); }
  function wrong() { tone({ freq: 200, type: 'sawtooth', dur: 0.2, vol: 0.14, glideTo: 96 }); }
  function award() { [659, 880, 1318].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.32, vol: 0.16, delay: i * 0.11 })); }

  /* Something in the facility physically moved. Spend sparingly. */
  function klonk() {
    tone({ freq: 150, type: 'square',   dur: 0.09, vol: 0.22, glideTo: 58 });
    tone({ freq: 78,  type: 'sine',     dur: 0.22, vol: 0.20, glideTo: 44, delay: 0.02 });
    tone({ freq: 1900, type: 'triangle', dur: 0.03, vol: 0.05 });   // the metallic edge of it
  }

  /* A cup meeting the floor. */
  function spill() {
    tone({ freq: 900, type: 'triangle', dur: 0.05, vol: 0.14 });
    tone({ freq: 420, type: 'sawtooth', dur: 0.30, vol: 0.16, glideTo: 90, delay: 0.03 });
    [1300, 1750, 1100].forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.04, vol: 0.05, delay: 0.09 + i * 0.055 }));
  }

  /* A single soft tick. Used by the final calibration, once a second,
     and by nothing else — so silence is audible when it stops. */
  function tick() { tone({ freq: 1180, type: 'sine', dur: 0.022, vol: 0.045 }); }

  /* ═══ FACILITY HUM ══════════════════════════════════════════
     Two slightly detuned low oscillators through a lowpass. Quiet
     enough to forget, obvious the moment it goes away.
     ═══════════════════════════════════════════════════════════ */
  const hum = (() => {
    let nodes = null, gain = null, level = 0;

    function build() {
      const c = ensure(); if (!c || nodes) return;
      try {
        gain = c.createGain();
        gain.gain.value = 0;
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 320;
        const a = c.createOscillator(), b = c.createOscillator();
        a.type = 'sine';     a.frequency.value = 56;
        b.type = 'triangle'; b.frequency.value = 56.7;   // slow beat against a
        a.connect(lp); b.connect(lp);
        lp.connect(gain).connect(master);
        a.start(); b.start();
        nodes = { a, b, lp };
      } catch (_) { nodes = null; }
    }

    function to(target, seconds) {
      level = target;
      if (muted) return;
      build();
      if (!gain || !ctx) return;
      try {
        const t = ctx.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), t);
        gain.gain.linearRampToValueAtTime(target, t + (seconds || 1.2));
      } catch (_) {}
    }

    function start() { to(0.022, 2.4); }
    function stop()  { to(0, 1.6); }
    /* The silence before the final calibration is a deliberate one. */
    function silence() { to(0, 2.6); }
    function _applyMute(m) {
      if (!gain || !ctx) return;
      try {
        const t = ctx.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(m ? 0 : level, t + 0.3);
      } catch (_) {}
    }
    return { start, stop, silence, _applyMute };
  })();

  /* ── Mute ───────────────────────────────────────────────────── */
  function setMuted(m) {
    muted = !!m;
    hum._applyMute(muted);
  }
  function isMuted() { return muted; }
  function toggleMute() {
    setMuted(!muted);
    if (!muted) { resume(); click(); }
    return muted;
  }

  return {
    resume, tone, blip, click,
    notify, alarm, maintenance,
    good, wrong, award, klonk, spill, tick,
    hum, setMuted, isMuted, toggleMute,
  };
})();

if (typeof window !== 'undefined') window.PPAudio = PPAudio;
