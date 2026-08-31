/**
 * ═══════════════════════════════════════════════════════════════
 * PAUSENPROTOKOLL — ROUND ENGINE
 * Team_Aperture
 *
 * Runs the rounds, renders messages, scores judgement calls, and
 * administers the final ten seconds.
 *
 * Scoring philosophy (brief §28): a mistake is never a restart. It
 * costs a little Pausenstabilität, produces the funniest line in the
 * script, and the run continues. Every run reaches the ending.
 * ═══════════════════════════════════════════════════════════════
 */

const PPGame = (() => {
  'use strict';

  const COST_UNNECESSARY = 5;   // pressed something that did not need pressing
  const COST_MISSED      = 8;   // let a genuine maintenance code expire
  const GAIN_CORRECT     = 2;   // handled a genuine one — a little credit back

  const FINAL_SECONDS    = 10;

  let el = {};
  let rounds = [];
  let roundIndex = 0;
  let stability = 100;
  let stats = null;
  let timers = [];
  let live = [];              // cards currently on screen with a lifetime
  let rafId = null;
  let ruleVisible = false;
  let socialExplained = false;
  let running = false;

  /* ─── small helpers ───────────────────────────────────────────── */
  const now = () => performance.now();
  function after(ms, fn) { const t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function reduced() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (_) { return false; }
  }
  /* How many messages may share the screen.
     On a phone this is 2, not 3. The finale is supposed to LOOK
     overwhelming, but every button it puts up must still be reachable
     without scrolling — and three stacked cards push the oldest one's
     button below the fold on a 360×640 device. Two cards keep the
     whole feed on screen; the round still feels frantic because the
     turnover is fast, not because the pile is deep.
     Note the pile is never re-ordered to favour genuine codes: that
     would make position a tell, and position must mean nothing. */
  function cardCap() {
    const w = window.innerWidth;
    return w < 640 ? 2 : w < 900 ? 3 : 4;
  }

  function freshStats() {
    return {
      unnecessary: 0,       // buttons pressed that did not need pressing
      correct: 0,           // genuine interventions handled
      missed: 0,            // genuine interventions ignored
      coffeeLost: 0,
      social: 0,            // times the player was decent to R-3MI
      fakesOffered: 0,      // how many unnecessary buttons were ever offered
      finalResets: 0,
      poweredOff: false,   // the monitor was switched off mid-break
    };
  }

  /* ═══ SET-UP ════════════════════════════════════════════════════ */
  function init() {
    el.shell    = document.getElementById('gameShell');
    el.feed     = document.getElementById('feed');
    el.feedIdle = document.getElementById('feedIdle');
    el.banner   = document.getElementById('feedBanner');
    el.roundNm  = document.getElementById('roundName');
    el.clock    = document.getElementById('roundClock');
    el.stabVal  = document.getElementById('stabValue');
    el.stabFill = document.getElementById('stabFill');
    el.stabDelta= document.getElementById('stabDelta');
    el.ruleCard = document.getElementById('ruleCard');
    el.ruleSoc  = document.getElementById('ruleSocial');
    el.live     = document.getElementById('liveRegion');
  }

  function announce(msg) {
    // Status changes reach a screen reader without stealing focus.
    if (!el.live) return;
    el.live.textContent = '';
    setTimeout(() => { el.live.textContent = msg; }, 40);
  }

  /* ═══ START / RESUME ════════════════════════════════════════════ */
  function start(resume) {
    rounds = PPEvents.rounds();
    PPEvents.verify();

    if (resume && resume.round > 0) {
      roundIndex = Math.min(resume.round, rounds.length - 1);
      stability  = typeof resume.stability === 'number' ? resume.stability : 100;
      stats      = { ...freshStats(), ...(resume.stats || {}) };
      ruleVisible = roundIndex >= 2;
    } else {
      roundIndex = 0;
      stability  = 100;
      stats      = freshStats();
      ruleVisible = false;
      socialExplained = false;
    }

    el.ruleCard.classList.toggle('hidden', !ruleVisible);
    running = true;
    paintStability(0);
    PPAudio.hum.start();
    startLifeLoop();
    runRound(roundIndex);
  }

  /* ═══ ROUNDS ════════════════════════════════════════════════════ */
  function runRound(i) {
    if (!running) return;
    roundIndex = i;
    const r = rounds[i];
    if (!r) { beginFinalTest(); return; }

    PPState.saveRun({ round: i, stability, stats });

    // Number and name are separate so a narrow screen can drop the name:
    // "RUNDE 04" is what the player needs, "DARSTELLUNGSTEST" is flavour,
    // and wrapped over three lines the flavour was pushing the messages
    // themselves off the bottom of a small phone.
    el.roundNm.innerHTML = '';
    const num = document.createElement('span');
    num.className = 'rn-num';
    num.textContent = `RUNDE ${String(i).padStart(2, '0')}`;
    const nm = document.createElement('span');
    nm.className = 'rn-name';
    nm.textContent = ` // ${r.name}`;
    el.roundNm.appendChild(num);
    el.roundNm.appendChild(nm);
    el.banner.textContent  = r.banner || '';

    const started = now();
    const tickClock = () => {
      if (!running) return;
      const left = Math.max(0, r.duration - (now() - started));
      const s = Math.ceil(left / 1000);
      el.clock.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      if (left > 0) after(200, tickClock);
    };
    tickClock();

    (r.script || []).forEach(step => {
      after(step.t, () => {
        if (!running) return;
        if (step.ev)  spawn(step.ev);
        if (step.say) PPDialogue.say(step.say, { auto: true });
        if (step.do === 'ruleCard') showRuleCard();
      });
    });

    after(r.duration, () => {
      if (!running) return;
      endRound(i);
    });
  }

  function endRound(i) {
    // Anything still on screen resolves on its own terms before the
    // next round starts: an ignored fake was ignored correctly, an
    // ignored maintenance code was missed.
    live.slice().forEach(c => resolveExpiry(c));
    after(900, () => running && runRound(i + 1));
  }

  function showRuleCard() {
    if (ruleVisible) return;
    ruleVisible = true;
    el.ruleCard.classList.remove('hidden');
    PPAudio.klonk();                          // a rule is a physical placard
    announce('Sicherheitsregel eingeblendet: Ein Wartungscode M gefolgt von zwei Ziffern bedeutet, Eingriff erforderlich. Alle anderen Meldungen sind nur informativ.');
  }

  /* ═══ MESSAGES ══════════════════════════════════════════════════ */
  function spawn(ev) {
    if (!running) return;

    if (ev.cat === 'DISTRACTION') stats.fakesOffered++;
    if (ev.cat === 'SPECIAL' && !socialExplained) {
      socialExplained = true;
      el.ruleSoc.classList.remove('hidden');
      announce('Hinweis: Meldungen der Kategorie SOZIAL gelten nicht als Arbeit und sind folgenlos.');
    }

    // Keep the screen usable. Every card counts against the cap —
    // including pure INFO, which has no button but takes just as much
    // vertical room and was perfectly capable of pushing a genuine
    // code's button off the bottom of a phone.
    // A genuine intervention is NEVER culled: it always gets its full
    // lifetime, on any screen size. Noise is dropped before anything
    // the player could act on, oldest first.
    while (live.filter(c => !c.resolved).length >= cardCap()) {
      const open = live.filter(c => !c.resolved);
      const victim = open.find(c => c.ev.cat === 'INFO')
                  || open.find(c => c.ev.cat !== 'INTERVENTION');
      if (!victim) break;
      resolveExpiry(victim, true);
    }

    const card = render(ev);
    el.feed.prepend(card.node);
    el.feedIdle.classList.add('hidden');

    if (ev.cat === 'INTERVENTION')      PPAudio.maintenance();
    else if (ev.tone === 'crit')        PPAudio.alarm();
    else                                PPAudio.notify();

    // Tracked whether or not it has a button: the lifetime loop expires
    // it, and the cap above counts it.
    card.born = now();
    card.life = ev.life || (ev.action ? 7500 : 6500);
    live.push(card);

    announce(`${ev.chip ? ev.chip + ': ' : ''}${ev.head}`);
  }

  function render(ev) {
    const node = document.createElement('article');
    node.className = `evt tone-${ev.tone || 'quiet'}`;
    node.setAttribute('role', 'listitem');

    if (ev.tone === 'crit') {
      const glow = document.createElement('div');
      glow.className = 'evt-glow';
      node.appendChild(glow);
    }

    const top = document.createElement('div');
    top.className = 'evt-top';

    const chip = document.createElement('span');
    chip.className = 'evt-chip';
    chip.textContent = ev.chip || 'MELDUNG';
    top.appendChild(chip);

    const head = document.createElement('h3');
    head.className = 'evt-head';
    head.textContent = ev.head;
    top.appendChild(head);
    node.appendChild(top);

    if (ev.body) {
      const body = document.createElement('p');
      body.className = 'evt-body';
      body.textContent = ev.body;
      node.appendChild(body);
    }

    const card = { node, ev, resolved: false, action: null, bar: null };

    if (ev.action) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'evt-action';
      // Bait pulses on fakes and on R-3MI's suggestions. Never on a
      // genuine code — the real ones must be able to look boring.
      if (ev.cat === 'DISTRACTION' && (ev.tone === 'crit' || ev.tone === 'r3mi')) btn.classList.add('bait');
      btn.textContent = ev.action;
      // The screen reader hears exactly what the screen shows: the chip
      // and the headline. No more, no less.
      btn.setAttribute('aria-label', `${ev.action.replace(/[[\]]/g, '').trim()} — ${ev.chip}: ${ev.head}`);
      btn.addEventListener('click', () => press(card));
      node.appendChild(btn);
      card.action = btn;

      const bar = document.createElement('div');
      bar.className = 'evt-life';
      node.appendChild(bar);
      card.bar = bar;
    }

    return card;
  }

  /* ─── the lifetime bars, one loop for all of them ─────────────── */
  function startLifeLoop() {
    if (rafId) return;
    const step = () => {
      const t = now();
      live.slice().forEach(c => {
        if (c.resolved) return;
        const p = Math.min(1, (t - c.born) / c.life);
        if (c.bar) c.bar.style.transform = `scaleX(${1 - p})`;
        if (p >= 1) resolveExpiry(c);
      });
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  }
  function stopLifeLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  /* ═══ JUDGEMENT ═════════════════════════════════════════════════ */
  function press(card) {
    if (card.resolved || !running) return;
    const ev = card.ev;
    card.resolved = true;
    detach(card);
    if (card.action) card.action.disabled = true;

    if (ev.cat === 'INTERVENTION') {
      stats.correct++;
      adjust(+GAIN_CORRECT);
      verdict(card, 'ok', 'INTERVENTION KORREKT.');
      if (ev.klonk) PPAudio.klonk(); else PPAudio.good();
      announce('Intervention korrekt.');
      if (ev.onAct) PPDialogue.say(ev.onAct, { auto: true });

    } else if (ev.cat === 'SPECIAL') {
      stats.social++;
      verdict(card, 'neut', 'ZWISCHENMENSCHLICH. NICHT ALS ARBEIT GEWERTET.');
      PPAudio.good();
      announce('Nicht als Arbeit gewertet. Keine Auswirkung.');
      if (ev.onAct) PPDialogue.say(ev.onAct, { auto: true });

    } else {
      stats.unnecessary++;
      adjust(-COST_UNNECESSARY);
      verdict(card, 'bad', `UNNÖTIGE ARBEIT ERKANNT. −${COST_UNNECESSARY} %`);
      PPAudio.wrong();
      announce(`Unnötige Arbeit erkannt. Pausenstabilität minus ${COST_UNNECESSARY} Prozent.`);
      if (ev.onAct) PPDialogue.say(ev.onAct, { auto: true });
    }

    fade(card.node, 3200);
  }

  /* A message that ran out its clock. `culled` means the screen was
     full and this one was pushed off — only ever a message that was
     safe to ignore anyway, so the outcome is identical. */
  function resolveExpiry(card, culled) {
    if (card.resolved) return;
    card.resolved = true;
    detach(card);
    const ev = card.ev;
    if (card.action) card.action.disabled = true;

    // Pure information: nothing was ever required, so it simply goes.
    // It still gets the .resolved class — the class is what marks a card
    // as no longer live, for styling and for anything counting the pile.
    if (ev.cat === 'INFO') {
      card.node.classList.add('resolved');
      fade(card.node, culled ? 300 : 0);
      return;
    }

    if (ev.cat === 'INTERVENTION') {
      stats.missed++;
      adjust(-COST_MISSED);
      verdict(card, 'bad', `${ev.code} NICHT BEARBEITET. −${COST_MISSED} %`);
      if (ev.missCoffee) { stats.coffeeLost++; PPAudio.spill(); }
      else PPAudio.wrong();
      announce(`${ev.code} nicht bearbeitet. Pausenstabilität minus ${COST_MISSED} Prozent.`);
      if (ev.onMiss) PPDialogue.say(ev.onMiss, { auto: true });

    } else if (ev.cat === 'SPECIAL') {
      verdict(card, 'neut', 'KEIN EINGRIFF. FOLGENLOS.');
      if (ev.onIgnore && !culled) PPDialogue.say(ev.onIgnore, { auto: true });

    } else {
      verdict(card, 'ok', 'KEIN EINGRIFF ERKANNT. KORREKT.');
      if (ev.onIgnore && !culled) PPDialogue.say(ev.onIgnore, { auto: true });
    }

    fade(card.node, culled ? 400 : 2600);
  }

  function detach(card) {
    const i = live.indexOf(card);
    if (i >= 0) live.splice(i, 1);
    if (card.bar) card.bar.style.transform = 'scaleX(0)';
  }

  function verdict(card, kind, text) {
    card.node.classList.add('resolved');
    const v = document.createElement('div');
    v.className = `evt-verdict ${kind}`;
    v.textContent = text;
    card.node.appendChild(v);
  }

  function fade(node, delay) {
    after(delay || 0, () => {
      node.classList.add('leaving');
      after(reduced() ? 0 : 300, () => {
        node.remove();
        if (!el.feed.querySelector('.evt')) el.feedIdle.classList.remove('hidden');
      });
    });
  }

  /* ═══ STABILITY ═════════════════════════════════════════════════ */
  function adjust(delta) {
    stability = Math.max(0, Math.min(100, stability + delta));
    paintStability(delta);
  }

  function paintStability(delta) {
    el.stabVal.innerHTML = `${Math.round(stability)}<span class="unit">%</span>`;
    el.stabFill.style.width = `${stability}%`;

    const tier = stability >= 70 ? '' : stability >= 40 ? 'mid' : 'low';
    el.stabVal.className  = `stab-value ${tier}`;
    el.stabFill.className = `stab-fill ${tier}`;

    if (delta) {
      el.stabDelta.textContent = `${delta > 0 ? '+' : '−'}${Math.abs(delta)} %`;
      el.stabDelta.className = `stab-delta ${delta > 0 ? 'plus' : 'minus'}`;
      after(2600, () => { el.stabDelta.textContent = ''; el.stabDelta.className = 'stab-delta'; });
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     THE FINAL TEN SECONDS
     Everything leaves the screen. The hum fades to nothing. The
     facility spends ten seconds doing its level best to make the
     player press a button that does nothing.
     A press is not a punishment — it costs no stability. It just
     starts the ten seconds again, which by this point is punishment
     enough.
     ═══════════════════════════════════════════════════════════════ */
  function beginFinalTest() {
    running = false;
    clearTimers();
    stopLifeLoop();
    live = [];
    PPDialogue.silence();
    PPAudio.hum.silence();
    PPMusic.hush(true, 2.6);       // the silence IS the test
    PPState.saveRun({ round: rounds.length, stability, stats });

    el.shell.classList.add('hidden');

    const stage = document.getElementById('finalStage');
    const clock = document.getElementById('finalClock');
    const slot  = document.getElementById('finalSlot');
    const note  = document.getElementById('finalResetNote');
    const ring  = document.getElementById('finalRing');
    stage.classList.remove('hidden');

    let remaining = FINAL_SECONDS;
    let attemptStart = 0;
    let localTimers = [];
    let raf = null;
    let finished = false;

    const lt = (ms, fn) => { const t = setTimeout(fn, ms); localTimers.push(t); return t; };
    const clearLocal = () => { localTimers.forEach(clearTimeout); localTimers = []; };

    function paint(sec) {
      clock.textContent = `00:${String(Math.max(0, sec)).padStart(2, '0')}`;
    }

    function attempt() {
      clearLocal();
      slot.innerHTML = '';
      remaining = FINAL_SECONDS;
      paint(remaining);
      attemptStart = now();
      let lastTick = FINAL_SECONDS;

      // The button. One element, one fixed size, appearing once.
      const bait = document.createElement('button');
      bait.type = 'button';
      bait.className = 'final-bait hidden';
      bait.textContent = '[ FORTFAHREN ]';
      bait.setAttribute('aria-label', 'Fortfahren. Diese Schaltfläche muss nicht gedrückt werden.');
      bait.addEventListener('click', onPress);

      lt(3000, () => { slot.appendChild(bait); bait.classList.remove('hidden'); });
      lt(5000, () => { bait.textContent = '[ WIRKLICH NICHT DRÜCKEN ]'; });
      lt(7000, () => { bait.classList.add('urgent'); });
      lt(8000, () => {
        PPDialogue.say([
          { speaker: 'R-3MI', text: '„Ich hasse das.“' },
          { speaker: 'V-TGM', text: 'Shh.', sub: 'Psst.' },
        ], { auto: true });
      });

      const loop = () => {
        if (finished) return;
        const elapsed = (now() - attemptStart) / 1000;
        const left = Math.max(0, FINAL_SECONDS - elapsed);
        const sec = Math.ceil(left);
        if (sec !== lastTick) {
          lastTick = sec;
          paint(sec);
          // The only sound in the whole sequence, and only at the end.
          if (sec <= 3 && sec > 0) PPAudio.tick();
        }
        ring.style.transform = `scaleX(${left / FINAL_SECONDS})`;
        if (left <= 0) { succeed(); return; }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    function onPress() {
      if (finished) return;
      stats.finalResets++;
      if (raf) cancelAnimationFrame(raf);
      PPDialogue.silence();
      PPAudio.wrong();
      clock.classList.add('resetting');
      note.textContent = 'AKTIVITÄT ERKANNT. TIMER ZURÜCKGESETZT.';
      announce('Aktivität erkannt. Timer zurückgesetzt. Zehn Sekunden erneut.');
      slot.innerHTML = '';
      setTimeout(() => {
        clock.classList.remove('resetting');
        note.textContent = '';
        attempt();
      }, 1500);
    }

    function succeed() {
      if (finished) return;
      finished = true;
      clearLocal();
      if (raf) cancelAnimationFrame(raf);
      slot.innerHTML = '';
      paint(0);
      announce('Erholung verifiziert.');

      // Silence, and then the facility admits it.
      setTimeout(() => { note.textContent = '…'; }, 1400);
      setTimeout(() => {
        note.textContent = '';
        PPAudio.good();
        PPDialogue.say([
          { speaker: 'SYSTEM', text: 'ERHOLUNG VERIFIZIERT.' },
        ], { auto: true });
      }, 3000);
      setTimeout(() => {
        stage.classList.add('hidden');
        PPResults.show({ stability, stats });
      }, 6200);
    }

    // A beat of genuine nothing before the clock even starts.
    setTimeout(() => {
      PPDialogue.say([
        { speaker: 'SYSTEM', text: 'ABSCHLUSSKALIBRIERUNG. AUFGABE: NICHTS TUN.' },
      ], { auto: true });
    }, 900);
    setTimeout(attempt, 4200);
    paint(FINAL_SECONDS);
  }

  /* ═══════════════════════════════════════════════════════════════
     THE MONITOR WENT OFF
     Callable at any point in a run. Everything stops where it stands
     and the result is scored on what actually happened up to here —
     the switch is an ending, not a cheat that skips to a perfect one.
     ═══════════════════════════════════════════════════════════════ */
  function poweredOff() {
    if (!stats) stats = freshStats();
    stats.poweredOff = true;
    running = false;
    clearTimers();
    stopLifeLoop();
    live = [];
    PPDialogue.silence();
    PPAudio.hum.stop();
    try { PPState.clearRun(); } catch (_) {}
    // The room is still there; only the screen has stopped.
    setTimeout(() => PPResults.show({ stability, stats }), 1400);
  }

  /* ═══ CONTROL ═══════════════════════════════════════════════════ */
  function abort() {
    running = false;
    clearTimers();
    stopLifeLoop();
    live = [];
    PPDialogue.silence();
  }

  return { init, start, abort, poweredOff, stateFor: () => ({ stability, stats: stats || freshStats(), roundIndex }) };
})();

if (typeof window !== 'undefined') window.PPGame = PPGame;
