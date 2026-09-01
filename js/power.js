/**
 * ═══════════════════════════════════════════════════════════════
 * PAUSENPROTOKOLL — THE POWER SWITCH
 * Team_Aperture
 *
 * The little green lamp on the monitor's plate is a real switch.
 * Hold it and the screen goes off.
 *
 * The facility files this as a failure to complete the protocol.
 * It is, of course, the only fully correct answer anyone has given
 * it all game: a break is a period during which you are not
 * available, and the player has just made themselves unavailable.
 * So it awards rank S — and no coordinates, because the protocol was
 * genuinely never finished and the Anlage is not sentimental.
 *
 * Press-and-hold rather than click, for the same reason real
 * monitors do it: ending a run by brushing a 6px lamp would be a
 * bug, not an easter egg.
 * ═══════════════════════════════════════════════════════════════
 */

const PPPower = (() => {
  'use strict';

  const HOLD_MS = 1150;

  let btn = null, deck = null, screen = null;
  let raf = null, startedAt = 0, armed = false, spent = false;
  let onOff = null, canPress = null;

  function reduced() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (_) { return false; }
  }

  /* `guard` says whether the switch is live. Once a run has produced a
     verdict there is nothing left to switch off — the screen would go
     dark underneath a results sheet that is still sitting on it. */
  function init(offHandler, guard) {
    onOff  = offHandler;
    canPress = guard || null;
    btn    = document.getElementById('deckPower');
    deck   = document.getElementById('deck');
    screen = document.getElementById('deckScreen');
    if (!btn) return;

    btn.addEventListener('pointerdown', begin);
    btn.addEventListener('pointerup', cancel);
    btn.addEventListener('pointercancel', cancel);
    // Distance rather than boundary: this target is 22px across, and
    // cancelling the moment a thumb strays outside it would make the
    // switch practically unusable on a phone.
    btn.addEventListener('pointermove', (e) => {
      if (!armed || e.clientX == null) return;
      if (Math.hypot(e.clientX - ox, e.clientY - oy) > SLOP) cancel();
    });
    // Keyboard: the same hold, on the same key.
    btn.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); begin(e); }
    });
    btn.addEventListener('keyup', e => {
      if (e.key === 'Enter' || e.key === ' ') cancel();
    });
    btn.addEventListener('blur', cancel);
    // A hold is not a click; never let one fall through as both.
    btn.addEventListener('click', e => e.preventDefault());
  }

  let ox = 0, oy = 0;
  const SLOP = 44;

  function begin(e) {
    if (spent || armed) return;
    if (canPress && !canPress()) return;
    armed = true;
    ox = e && e.clientX != null ? e.clientX : 0;
    oy = e && e.clientY != null ? e.clientY : 0;
    startedAt = performance.now();
    btn.classList.add('holding');
    try { btn.setPointerCapture && e.pointerId != null && btn.setPointerCapture(e.pointerId); } catch (_) {}
    try { PPAudio.tone({ freq: 240, type: 'square', dur: 0.04, vol: 0.08 }); } catch (_) {}
    tick();
  }

  function tick() {
    if (!armed) return;
    const p = Math.min(1, (performance.now() - startedAt) / HOLD_MS);
    btn.style.setProperty('--hold', p.toFixed(3) + 'turn');
    if (p >= 1) { armed = false; fire(); return; }
    raf = requestAnimationFrame(tick);
  }

  function cancel() {
    if (!armed) return;
    armed = false;
    if (raf) cancelAnimationFrame(raf);
    btn.classList.remove('holding');
    btn.style.setProperty('--hold', '0turn');
  }

  function fire() {
    if (spent) return;
    spent = true;
    if (raf) cancelAnimationFrame(raf);
    btn.classList.remove('holding');
    btn.style.setProperty('--hold', '0turn');
    btn.disabled = true;
    btn.setAttribute('aria-label', 'Monitor ausgeschaltet.');

    // Something physical in the facility just changed.
    try { PPAudio.klonk(); } catch (_) {}

    screen.classList.add('powering-off');
    const settle = () => {
      screen.classList.remove('powering-off');
      screen.classList.add('off');
      deck.classList.add('screen-off');
      const dark = document.createElement('div');
      dark.className = 'deck-dark';
      screen.appendChild(dark);
      if (onOff) onOff();
    };
    setTimeout(settle, reduced() ? 60 : 760);
  }

  /* Coming back to the menu puts the monitor back on. */
  function reset() {
    spent = false; armed = false;
    if (!btn) return;
    btn.disabled = false;
    btn.setAttribute('aria-label', 'Monitor ausschalten. Zum Ausschalten gedrückt halten.');
    btn.classList.remove('holding');
    btn.style.setProperty('--hold', '0turn');
    screen.classList.remove('off', 'powering-off');
    deck.classList.remove('screen-off');
    screen.querySelector('.deck-dark')?.remove();
  }

  function isOff() { return spent; }

  return { init, reset, isOff };
})();

if (typeof window !== 'undefined') window.PPPower = PPPower;
