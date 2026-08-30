/**
 * ═══════════════════════════════════════════════════════════════
 * PAUSENPROTOKOLL — RESULTS, RANK, ENDING
 * Team_Aperture
 *
 * The assessment is meant to be funny, not punishing. Even a run
 * that pressed everything gets a full ending and an award for it —
 * playing badly is supposed to be one of the more entertaining ways
 * to play. Nothing here says "failed".
 * ═══════════════════════════════════════════════════════════════
 */

const PPResults = (() => {
  'use strict';

  /* ─── RANKS ───────────────────────────────────────────────────
     Ordered best to worst; the first whose test passes is awarded. */
  const RANKS = [
    {
      id: 'S', letter: 'S', name: 'PROFESSIONELLER NICHTSTUER',
      color: 'var(--accent-r3mi)',
      note: 'KEINE UNNÖTIGE TÄTIGKEIT. KEINE VERSÄUMTE WARTUNG. DIE ANLAGE HAT NICHTS ZU BEANSTANDEN UND WEISS DAMIT NICHTS ANZUFANGEN.',
      test: (s, st) => s >= 95 && st.missed === 0 && st.unnecessary === 0,
    },
    {
      id: 'A', letter: 'A', name: 'VOLLSTÄNDIG ERHOLT',
      color: 'var(--accent-r3mi)',
      note: 'ALLE WARTUNGSCODES BEARBEITET. GELEGENTLICHE ÜBERMOTIVATION IM RAHMEN.',
      test: (s, st) => s >= 85 && st.missed === 0,
    },
    {
      id: 'B', letter: 'B', name: 'LEICHT ARBEITSSÜCHTIG',
      color: 'var(--accent-system)',
      note: 'MEHRERE UNNÖTIGE EINGRIFFE. DIE PAUSE WURDE ÜBERWIEGEND ÜBERSTANDEN.',
      test: (s) => s >= 70,
    },
    {
      id: 'C', letter: 'C', name: 'PAUSE NICHT VERSTANDEN',
      color: 'var(--accent-warn)',
      note: 'ERHEBLICHE AKTIVITÄT WÄHREND EINES AUSDRÜCKLICH TÄTIGKEITSFREIEN ZEITRAUMS.',
      test: (s) => s >= 45,
    },
    {
      id: 'D', letter: 'D', name: 'R-3MI',
      color: 'var(--accent-r3mi)',
      note: 'DIE ANLAGE HAT FÜR DIESE BEWERTUNGSSTUFE EIGENS EINEN NAMEN VERGEBEN.',
      test: () => true,
    },
  ];

  /* ─── AWARDS ──────────────────────────────────────────────────
     Five, deliberately. This is a spin-off, not an achievement list. */
  const AWARDS = [
    { id: 'prof',   name: 'PROFESSIONELLER NICHTSTUER', desc: 'RANG S ERREICHT.',
      test: (s, st, rank) => rank.id === 'S' },
    { id: 'kaffee', name: 'KAFFEE IST HEILIG',          desc: 'KEIN GETRÄNK VERLOREN.',
      test: (s, st) => st.coffeeLost === 0 },
    { id: 'selbst', name: 'SELBSTBEHERRSCHUNG',         desc: 'ABSCHLUSSKALIBRIERUNG OHNE ZURÜCKSETZUNG.',
      test: (s, st) => st.finalResets === 0 },
    { id: 'mitarb', name: 'MITARBEITER DES MONATS',     desc: 'NAHEZU JEDE UNNÖTIGE MASSNAHME ERGRIFFEN. PAUSENBEWERTUNG: KATASTROPHAL.',
      test: (s, st) => st.fakesOffered > 0 && st.unnecessary >= Math.max(6, Math.ceil(st.fakesOffered * 0.7)) },
    { id: 'drang',  name: 'D-RANG',                     desc: 'DIE PRESTIGETRÄCHTIGE R-3MI-BEWERTUNG.',
      test: (s, st, rank) => rank.id === 'D' },
  ];

  let onReplay = null;

  function rankFor(stability, stats) {
    return RANKS.find(r => r.test(stability, stats)) || RANKS[RANKS.length - 1];
  }

  function show(run) {
    const stability = Math.round(run.stability);
    const stats = run.stats;
    const rank = rankFor(stability, stats);
    const earned = AWARDS.filter(a => a.test(stability, stats, rank));

    PPState.clearRun();
    PPState.countPlay();
    earned.forEach(a => PPState.grant(a.id));

    const view = document.getElementById('results');
    const card = document.getElementById('resCard');
    const tier = stability >= 70 ? '' : stability >= 40 ? 'mid' : 'low';

    card.innerHTML = `
      <div class="res-head">PAUSENPROTOKOLL ABGESCHLOSSEN</div>
      <h2 class="res-title">AUSWERTUNG</h2>

      <div>
        <div class="res-head">PAUSENSTABILITÄT</div>
        <div class="res-stab ${tier}">${stability}<span class="unit">%</span></div>
      </div>

      <dl class="res-stats">
        <dt>Unnötige Eingriffe</dt><dd>${stats.unnecessary}</dd>
        <dt>Korrekte Interventionen</dt><dd>${stats.correct}</dd>
        <dt>Verpasste Interventionen</dt><dd>${stats.missed}</dd>
        <dt>Kaffeeverluste</dt><dd>${stats.coffeeLost}</dd>
        <dt>Zurücksetzungen im Finale</dt><dd>${stats.finalResets}</dd>
      </dl>

      <div class="res-rank" style="--rank-color:${rank.color}">
        <div class="res-head">BEWERTUNG</div>
        <div class="res-rank-letter">${rank.letter}</div>
        <div class="res-rank-name">${rank.name}</div>
        <p class="res-rank-note">${rank.note}</p>
      </div>

      ${earned.length ? `
      <div>
        <div class="res-head">SONDERAUSZEICHNUNGEN</div>
        <div class="res-awards">
          ${earned.map(a => `
            <div class="res-award">
              <span class="res-award-name">${a.name}</span>
              <span class="res-award-desc">${a.desc}</span>
            </div>`).join('')}
        </div>
      </div>` : ''}

      <div class="res-actions">
        <button class="ka-btn primary" id="resContinue" type="button">[ WEITER ]</button>
      </div>
    `;

    view.classList.remove('hidden');
    PPMusic.hush(false, 2.0);       // and back in for the verdict
    document.getElementById('resContinue').addEventListener('click', () => {
      view.classList.add('hidden');
      ending(stats, rank);
    });

    // Move focus to the results so a keyboard player is not left behind
    // on a button that no longer exists.
    setTimeout(() => document.getElementById('resContinue')?.focus(), 60);

    PPAudio.award();

    // The two lines the D rank exists for.
    const lines = [];
    if (rank.id === 'D') {
      lines.push({ speaker: 'R-3MI', text: '„HEY.“' });
      lines.push({ speaker: 'V-TGM', text: 'Accurate.', sub: 'Zutreffend.' });
    } else if (rank.id === 'S') {
      lines.push({ speaker: 'V-TGM', text: 'You did nothing. Perfectly.', sub: 'Du hast nichts getan. Perfekt.' });
      lines.push({ speaker: 'R-3MI', text: '„Ich möchte betonen, dass ich daran beteiligt war.“' });
    } else if (stats.missed > 0 && stats.unnecessary > 0) {
      lines.push({ speaker: 'R-3MI', text: '„Wir haben das Falsche gedrückt und das Richtige nicht.“' });
      lines.push({ speaker: 'V-TGM', text: 'Symmetrical, at least.', sub: 'Immerhin symmetrisch.' });
    }
    if (earned.some(a => a.id === 'mitarb')) {
      lines.push({ speaker: 'SYSTEM', text: 'SONDERAUSZEICHNUNG: MITARBEITER DES MONATS.' });
      lines.push({ speaker: 'V-TGM', text: 'That is not a compliment.', sub: 'Das ist kein Kompliment.' });
      lines.push({ speaker: 'R-3MI', text: '„Ich nehme sie trotzdem.“' });
    }
    if (lines.length) setTimeout(() => PPDialogue.say(lines, { auto: true }), 1200);
  }

  /* ═══ ENDING ════════════════════════════════════════════════════ */
  function ending(stats, rank) {
    PPDialogue.silence();
    const view = document.getElementById('ending');
    const box  = document.getElementById('endingLines');
    view.classList.remove('hidden');
    box.innerHTML = '';

    const beat = (text, cls) => ({ text, cls: cls || '' });

    const script = [
      beat('PAUSENPROTOKOLL ERFOLGREICH.'),
      beat('MENSCHLICHE REGENERATION: VERSTANDEN.'),
      beat('PRODUKTIVITÄTSSTEIGERUNG: 3.1 %', 'dim'),
    ];

    let i = 0;
    const push = (b, delay) => setTimeout(() => {
      const d = document.createElement('div');
      d.className = `end-line ${b.cls}`;
      d.textContent = b.text;
      box.appendChild(d);
      requestAnimationFrame(() => d.classList.add('visible'));
      PPAudio.tick();
    }, delay);

    script.forEach((b, n) => push(b, 700 + n * 1500));

    setTimeout(() => {
      PPDialogue.say([
        { speaker: 'R-3MI', text: '„Dafür haben wir das alles gemacht?“' },
        { speaker: 'V-TGM', text: 'Three point one percent.', sub: 'Drei Komma eins Prozent.' },
        { speaker: 'R-3MI', text: '„Ich brauche jetzt erstmal eine Pause.“' },
      ], { auto: true });
    }, 5600);

    // The facility answers that with a number.
    setTimeout(() => {
      box.innerHTML = '';
      const label = document.createElement('div');
      label.className = 'end-line';
      label.textContent = 'NÄCHSTE GENEHMIGTE PAUSE IN:';
      const clock = document.createElement('div');
      clock.className = 'end-clock';
      clock.textContent = '05:59:59';
      box.appendChild(label);
      box.appendChild(clock);
      requestAnimationFrame(() => { label.classList.add('visible'); clock.classList.add('visible'); });
      PPAudio.klonk();
    }, 15000);

    setTimeout(() => {
      PPDialogue.say([
        { speaker: 'R-3MI', text: '„SECHS STUNDEN?!“' },
        { speaker: 'V-TGM', text: 'Back to work.', sub: 'Zurück an die Arbeit.' },
      ], { auto: true });
    }, 16800);

    // Title card, then the last joke.
    setTimeout(() => {
      PPDialogue.silence();
      box.innerHTML = '';
      const a = document.createElement('div');
      a.className = 'end-line dim';
      a.textContent = 'DIE KALIBRIERUNGSANLAGE';
      const b = document.createElement('div');
      b.className = 'end-line big';
      b.textContent = 'PAUSENPROTOKOLL';
      const c = document.createElement('div');
      c.className = 'end-line thanks';
      c.textContent = 'Danke fürs Nichtstun.';
      [a, b, c].forEach((n, k) => {
        box.appendChild(n);
        setTimeout(() => n.classList.add('visible'), 200 + k * 700);
      });
    }, 22500);

    setTimeout(() => {
      const d = document.createElement('div');
      d.className = 'end-line';
      d.style.marginTop = 'var(--sp-lg)';
      d.textContent = 'PAUSENZEIT ÜBERSCHRITTEN. BITTE ARBEIT WIEDER AUFNEHMEN.';
      box.appendChild(d);
      requestAnimationFrame(() => d.classList.add('visible'));
      PPAudio.alarm();
    }, 27500);

    // And the way back, once the joke has landed.
    setTimeout(() => {
      const row = document.createElement('div');
      row.className = 'res-actions';
      row.style.marginTop = 'var(--sp-lg)';
      row.innerHTML = `
        <button class="ka-btn go" id="endAgain" type="button">[ NOCHMAL PAUSE MACHEN ]</button>
        <button class="ka-btn small" id="endMenu" type="button">[ HAUPTMENÜ ]</button>`;
      box.appendChild(row);
      document.getElementById('endAgain').addEventListener('click', () => onReplay && onReplay('again'));
      document.getElementById('endMenu').addEventListener('click', () => onReplay && onReplay('menu'));
      document.getElementById('endAgain').focus();
    }, 30000);

    // Skipping ahead is always allowed; the credits are not a test.
    const skip = document.getElementById('endSkip');
    skip.classList.remove('hidden');
  }

  function setReplayHandler(fn) { onReplay = fn; }

  /* Jump straight to the buttons at the end of the ending. */
  function skipEnding() {
    const box = document.getElementById('endingLines');
    box.innerHTML = '';
    PPDialogue.silence();
    const a = document.createElement('div');
    a.className = 'end-line dim visible';
    a.textContent = 'DIE KALIBRIERUNGSANLAGE';
    const b = document.createElement('div');
    b.className = 'end-line big visible';
    b.textContent = 'PAUSENPROTOKOLL';
    const c = document.createElement('div');
    c.className = 'end-line thanks visible';
    c.textContent = 'Danke fürs Nichtstun.';
    const row = document.createElement('div');
    row.className = 'res-actions';
    row.style.marginTop = 'var(--sp-lg)';
    row.innerHTML = `
      <button class="ka-btn go" id="endAgain" type="button">[ NOCHMAL PAUSE MACHEN ]</button>
      <button class="ka-btn small" id="endMenu" type="button">[ HAUPTMENÜ ]</button>`;
    [a, b, c, row].forEach(n => box.appendChild(n));
    document.getElementById('endAgain').addEventListener('click', () => onReplay && onReplay('again'));
    document.getElementById('endMenu').addEventListener('click', () => onReplay && onReplay('menu'));
    document.getElementById('endAgain').focus();
  }

  return { show, rankFor, setReplayHandler, skipEnding, RANKS, AWARDS };
})();

if (typeof window !== 'undefined') window.PPResults = PPResults;
