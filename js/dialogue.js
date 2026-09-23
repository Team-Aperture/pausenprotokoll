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

  /* The same two units, whole, sitting at the desk in front of the
     monitor and standing by the terminal in the cafeteria. Same line
     work as the portraits, filled dark so they read as solid bodies
     against the warm room. R-3MI's eye is off-centre on purpose: he is
     looking at the screen. V-TGM is looking at R-3MI. */
  const CREW = {
    'R-3MI':
        '<line class="bot-antenna crew-antenna" x1="52" y1="27" x2="55" y2="12"/>'
      + '<circle class="bot-antenna-tip crew-antenna" cx="55.5" cy="9.5" r="3"/>'
      + '<path class="bot-frame crew-torso" d="M22 96 Q22 81 37 81 H71 Q86 81 86 96 L92 152 H16 Z"/>'
      + '<circle class="crew-light" cx="54" cy="106" r="4"/>'
      + '<path class="crew-arm" d="M82 94 Q101 112 104 140"/>'
      + '<rect class="crew-neck" x="47" y="72" width="14" height="10" rx="2"/>'
      + '<rect class="bot-frame" x="27" y="27" width="54" height="47" rx="15"/>'
      + '<g class="bot-eyes"><circle class="bot-eye" cx="63" cy="46" r="8.5"/></g>'
      + '<rect class="bot-mouth" x="44" y="62" width="18" height="3" rx="1.5"/>',
    'V-TGM':
        '<path class="bot-frame crew-torso" d="M46 114 Q46 100 61 100 H91 Q106 100 106 114 L112 152 H40 Z"/>'
      + '<circle class="crew-light" cx="76" cy="124" r="4"/>'
      + '<rect class="crew-neck" x="69" y="88" width="14" height="13" rx="2"/>'
      + '<rect class="bot-tube" x="103" y="24" width="10" height="28" rx="4"/>'
      + '<circle class="bot-frame" cx="76" cy="58" r="32"/>'
      + '<g class="bot-eyes"><circle class="bot-eye" cx="64" cy="54" r="11"/></g>'
      + '<rect class="bot-mouth" x="62" y="77" width="22" height="3" rx="1.5"/>',
  };
  function crewSVG(unit) {
    const s = SPEAKERS[unit];
    if (!s || !CREW[unit]) return '';
    return `<svg class="crew-svg ${s.idle}" viewBox="0 0 150 152" preserveAspectRatio="xMidYMax meet"
      aria-hidden="true" focusable="false" style="--bot-color: var(${s.colorVar})">${CREW[unit]}</svg>`;
  }

  let el = {}, queue = [], index = -1;
  let typing = false, typeTimer = null, autoTimer = null;
  let onComplete = null, autoMode = true;
  let pace = 1, typeSpeed = 26;
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

    // Whoever is drawn in the room is drawn from the same source.
    document.querySelectorAll('[data-crew]').forEach(n => { n.innerHTML = crewSVG(n.dataset.crew); });

    el.next.addEventListener('click', () => { advance(); });

    // Tapping the line itself skips the typewriter — but never counts as
    // a game interaction, and never advances past a line unread.
    el.box.addEventListener('click', (e) => {
      if (e.target.closest('#dlgNext')) return;
      if (typing) finishTyping();
    });

    watchSize();
  }

  /* The strip sits in the cafeteria now, on the desk in front of the
     monitor — the units are looking AT the screen, not trapped inside
     it. Where there is room for it below the monitor it overlaps
     nothing and the game needs no padding at all.

     On a phone the monitor fills the window and the strip has to lie
     over the bottom of it, so the amount actually overlapping the
     screen is measured and published; the feed reserves exactly that
     and not a pixel more. */
  function syncSpace() {
    try {
      const up = !!(el.container && el.container.classList.contains('visible'));
      let overlap = 0;
      if (up) {
        // Measure where the strip COMES TO REST, not where it is right
        // now. It slides up over 0.4s, and getBoundingClientRect()
        // follows that transform — so measuring live reported "no
        // overlap" for the whole slide and the feed briefly reserved
        // nothing while the strip was already covering it. offsetHeight
        // ignores transforms, so the settled position is exact from the
        // first frame.
        const h = el.container.offsetHeight;
        const restingTop = window.innerHeight - h;
        const screen = document.getElementById('deckScreen');
        const s = screen ? screen.getBoundingClientRect() : { bottom: window.innerHeight };
        overlap = Math.max(0, Math.ceil(s.bottom - restingTop));
      }
      const was = document.documentElement.style.getPropertyValue('--dlg-h');
      document.documentElement.style.setProperty('--dlg-h', overlap + 'px');
      // Tell the game the moment the room under the messages changes, so
      // it can re-fit the pile now rather than at its next periodic check.
      if (was !== overlap + 'px') window.dispatchEvent(new Event('pp:space'));
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

  /* ═══ FORMS OF ADDRESS ═══════════════════════════════════════════
     The two units are R-3MI and V-TGM, in their own universe, and that
     is all they ever call each other. Nobody on the team gets written
     into the script by accident — the names below slipped in once and
     were caught by a reader, not a test. Every line that reaches the
     strip is checked, wherever in the code it was written. */
  const NOT_THEIR_NAMES = /\b(remi|amanda)\b/i;
  const ADDRESS_PROBLEMS = [];
  function checkAddress(lines) {
    lines.forEach(l => {
      const t = `${l.text || ''} ${l.sub || ''}`;
      if (NOT_THEIR_NAMES.test(t)) {
        ADDRESS_PROBLEMS.push(t);
        console.error('[PAUSENPROTOKOLL] Anrede ohne Bezeichnung: "' + t + '" — nur R-3MI / V-TGM.');
      }
    });
  }

  /**
   * say(lines, opts)
   *   lines: [{ speaker, text, sub }]
   *   opts.auto     — true (default): each line advances itself and the
   *                   round keeps running. false: waits for [ WEITER ].
   *   opts.pace     — multiplier on how long a finished line is held.
   *                   Below 1 for a scene that has somewhere to be.
   *   opts.speed    — ms per character while typing.
   *   opts.onDone   — called once the last line is finished.
   */
  function say(lines, opts) {
    opts = opts || {};
    clearTimers();
    queue = (lines || []).filter(Boolean);
    checkAddress(queue);
    index = -1;
    autoMode = opts.auto !== false;
    pace = opts.pace || 1;
    typeSpeed = opts.speed || 26;
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
    // The units at the desk light up when it is their line.
    document.body.dataset.speaker = line.speaker;
    document.body.classList.add('typing');
    syncSpace();
    try { PPMusic.duck(true); } catch (_) {}

    typeText(line.text || '', line.speaker, () => {
      el.portrait.classList.remove('speaking');
      document.body.classList.remove('typing');
      syncSpace();
      if (autoMode) {
        // Long enough to read, short enough that the facility does not
        // feel like it is waiting for permission.
        const ms = Math.max(2200, 850 + (line.text || '').length * 45 + (line.sub ? 600 : 0));
        autoTimer = setTimeout(() => { autoTimer = null; advance(); }, ms * pace);
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
    }, typeSpeed);
  }

  function finishTyping() {
    if (!typing) return;
    clearInterval(typeTimer);
    typeTimer = null;
    typing = false;
    el.text.textContent = queue[index] ? (queue[index].text || '') : '';
    el.portrait.classList.remove('speaking');
    document.body.classList.remove('typing');
    syncSpace();
    if (autoMode) {
      autoTimer = setTimeout(() => { autoTimer = null; advance(); }, 1800);
    }
  }

  function hide() {
    clearTimers();
    el.container?.classList.remove('visible');
    el.portrait?.classList.remove('speaking');
    delete document.body.dataset.speaker;
    document.body.classList.remove('typing');
    syncSpace();
    try { PPMusic.duck(false); } catch (_) {}
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

  /* Something is being said right now. The streak remarks wait for this
     to be false rather than talk over a line already in progress. */
  function isBusy() { return !!(el.container && el.container.classList.contains('visible')); }

  return { init, say, hide, silence, settle, faceSVG, crewSVG, isBusy,
           addressProblems: () => ADDRESS_PROBLEMS.slice() };
})();

if (typeof window !== 'undefined') window.PPDialogue = PPDialogue;
