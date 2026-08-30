/**
 * ═══════════════════════════════════════════════════════════════
 * PAUSENPROTOKOLL — DIALOGUE
 * Team_Aperture
 *
 * KA-II's dialogue strip, with one change that matters here.
 *
 * In KA-II a line of dialogue waits for the player. In Pausenprotokoll
 * the facility does not stop sending messages just because someone is
 * talking, so lines spoken DURING a round advance on their own (auto
 * mode) and the round keeps running underneath. Lines between rounds
 * wait for a real [ WEITER ] button, which is a button, focusable, and
 * announced — not a "click anywhere" region.
 *
 * Nothing said here is ever the answer. R-3MI and V-TGM comment on
 * what the player is doing; they never tell them which message is
 * genuine. (Their comments AFTER an outcome may confirm it — by then
 * the player has already committed.)
 *
 * Language: R-3MI speaks German, V-TGM speaks English with a German
 * subtitle underneath, exactly as the series does it. No voice acting
 * is assumed anywhere.
 * ═══════════════════════════════════════════════════════════════
 */

const PPDialogue = (() => {
  'use strict';

  const SPEAKERS = {
    'R-3MI':  { colorVar: '--accent-r3mi',   face: 'humanoid', idle: 'face-dart' },
    'V-TGM':  { colorVar: '--accent-vtgm',   face: 'orb',      idle: 'face-calm' },
    'SYSTEM': { colorVar: '--accent-system', face: 'system',   idle: 'face-scan' },
  };

  /* The two units, drawn the way KA-II draws them: R-3MI a one-eyed
     humanoid with a restless gaze, V-TGM a sphere with a test tube and
     a gaze that does not move at all. Their idle animations are the
     whole joke about which of them can take a break. */
  const BODY = {
    humanoid:
        '<line class="bot-antenna" x1="32" y1="6" x2="32" y2="-4"/>'
      + '<circle class="bot-antenna-tip" cx="32" cy="-5" r="2.5"/>'
      + '<rect class="bot-frame" x="9" y="6" width="46" height="50" rx="14"/>'
      + '<g class="bot-eyes"><circle class="bot-eye" cx="32" cy="30" r="10"/></g>'
      + '<rect class="bot-mouth" x="22" y="47" width="20" height="3" rx="1.5"/>',
    orb:
        '<rect class="bot-tube" x="49" y="12" width="8" height="20" rx="3"/>'
      + '<circle class="bot-frame" cx="31" cy="32" r="25"/>'
      + '<g class="bot-eyes"><circle class="bot-eye" cx="31" cy="30" r="11"/></g>'
      + '<rect class="bot-mouth" x="21" y="47" width="20" height="3" rx="1.5"/>',
    system:
        '<rect class="bot-frame" x="9" y="8" width="46" height="46" rx="8"/>'
      + '<rect class="bot-scan" x="16" y="20" width="32" height="3" rx="1.5"/>'
      + '<rect class="bot-scan" x="16" y="30" width="32" height="3" rx="1.5"/>'
      + '<rect class="bot-scan" x="16" y="40" width="32" height="3" rx="1.5"/>',
  };

  function faceSVG(speaker) {
    const s = SPEAKERS[speaker] || SPEAKERS['SYSTEM'];
    return `<svg class="bot-face ${s.idle}" viewBox="-10 -10 84 76" aria-hidden="true"
      style="--bot-color: var(${s.colorVar})">${BODY[s.face]}</svg>`;
  }

  let el = {}, queue = [], index = -1;
  let typing = false, typeTimer = null, autoTimer = null;
  let onComplete = null, autoMode = true;
  let sizeObserver = null;

  function reduced() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (_) { return false; }
  }

  function init() {
    el.container = document.getElementById('dlgContainer');
    el.box       = document.getElementById('dlgBox');
    el.portrait  = document.getElementById('dlgPortrait');
    el.speaker   = document.getElementById('dlgSpeaker');
    el.text      = document.getElementById('dlgText');
    el.sub       = document.getElementById('dlgSub');
    el.next      = document.getElementById('dlgNext');

    el.next.addEventListener('click', () => { advance(); });

    // Tapping the line itself skips the typewriter — but never counts as
    // a game interaction, and never advances past a line unread.
    el.box.addEventListener('click', (e) => {
      if (e.target.closest('#dlgNext')) return;
      if (typing) finishTyping();
    });

    watchSize();
  }

  /* The strip is fixed to the bottom edge. Everything that scrolls
     underneath reserves exactly its measured height so no message and
     no button can end up trapped behind it. */
  function syncSpace() {
    try {
      const up = !!(el.container && el.container.classList.contains('visible'));
      const h = up ? Math.ceil(el.container.getBoundingClientRect().height) : 0;
      document.documentElement.style.setProperty('--dlg-h', h + 'px');
    } catch (_) {}
  }
  function watchSize() {
    if (sizeObserver || !el.container) return;
    try {
      sizeObserver = new ResizeObserver(syncSpace);
      sizeObserver.observe(el.container);
    } catch (_) { sizeObserver = null; }
    try { window.addEventListener('resize', syncSpace); } catch (_) {}
  }

  /**
   * say(lines, opts)
   *   lines: [{ speaker, text, sub }]
   *   opts.auto     — true (default): each line advances itself and the
   *                   round keeps running. false: waits for [ WEITER ].
   *   opts.onDone   — called once the last line is finished.
   */
  function say(lines, opts) {
    opts = opts || {};
    clearTimers();
    queue = (lines || []).filter(Boolean);
    index = -1;
    autoMode = opts.auto !== false;
    onComplete = opts.onDone || null;
    el.next.classList.toggle('hidden', autoMode);
    advance();
  }

  function clearTimers() {
    if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
    typing = false;
  }

  function advance() {
    if (typing) { finishTyping(); return; }
    index++;
    if (index >= queue.length) {
      hide();
      const done = onComplete;
      onComplete = null;
      if (done) done();
      return;
    }
    play(queue[index]);
  }

  function play(line) {
    const s = SPEAKERS[line.speaker] || SPEAKERS['SYSTEM'];
    const color = `var(${s.colorVar})`;

    el.box.style.setProperty('--spk-color', color);
    el.speaker.textContent = line.speaker;
    el.speaker.style.color = color;
    el.sub.textContent = line.sub || '';
    el.portrait.innerHTML = faceSVG(line.speaker);

    el.container.classList.add('visible');
    el.portrait.classList.add('speaking');
    syncSpace();

    typeText(line.text || '', line.speaker, () => {
      el.portrait.classList.remove('speaking');
      syncSpace();
      if (autoMode) {
        // Long enough to read, short enough that the facility does not
        // feel like it is waiting for permission.
        const ms = Math.max(2200, 850 + (line.text || '').length * 45 + (line.sub ? 600 : 0));
        autoTimer = setTimeout(() => { autoTimer = null; advance(); }, ms);
      }
    });
  }

  function typeText(full, speaker, done) {
    if (typeTimer) clearInterval(typeTimer);
    el.text.textContent = '';
    if (!full.length) { done(); return; }

    // A player who asked for less motion gets the line, not the typing.
    if (reduced()) { el.text.textContent = full; done(); return; }

    typing = true;
    let i = 0;
    typeTimer = setInterval(() => {
      const ch = full[i++];
      el.text.textContent += ch;
      if (ch !== ' ' && i % 3 === 0) PPAudio.blip(speaker);
      if (i >= full.length) {
        clearInterval(typeTimer);
        typeTimer = null;
        typing = false;
        done();
      }
    }, 26);
  }

  function finishTyping() {
    if (!typing) return;
    clearInterval(typeTimer);
    typeTimer = null;
    typing = false;
    el.text.textContent = queue[index] ? (queue[index].text || '') : '';
    el.portrait.classList.remove('speaking');
    syncSpace();
    if (autoMode) {
      autoTimer = setTimeout(() => { autoTimer = null; advance(); }, 1800);
    }
  }

  function hide() {
    clearTimers();
    el.container?.classList.remove('visible');
    el.portrait?.classList.remove('speaking');
    syncSpace();
  }

  /* Used when the facility wants real silence (the final calibration). */
  function silence() {
    queue = [];
    index = -1;
    onComplete = null;
    hide();
  }

  /* R-3MI stops fidgeting once he has finally managed to do nothing. */
  function settle(on) {
    const f = el.portrait?.querySelector('.face-dart');
    if (f) f.classList.toggle('at-ease', !!on);
  }

  return { init, say, hide, silence, settle, faceSVG };
})();

if (typeof window !== 'undefined') window.PPDialogue = PPDialogue;
