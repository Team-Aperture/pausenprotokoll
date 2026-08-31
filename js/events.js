/**
 * ═══════════════════════════════════════════════════════════════
 * PAUSENPROTOKOLL — EVENT DATA
 * Team_Aperture
 *
 * ── THE ONE RULE ───────────────────────────────────────────────
 *
 * A message requires action IF AND ONLY IF its chip is a
 * maintenance code of the form M-NN.
 *
 * That is the entire puzzle, and it is enforced structurally rather
 * than remembered by hand:
 *
 *   • `cat: 'INTERVENTION'` is the only category that may carry a
 *     `code`, and every intervention MUST carry one.
 *   • No other message may contain the string "M-" anywhere in its
 *     chip, headline or body. verify() below asserts this at load
 *     and shouts in the console if a new joke ever breaks it.
 *
 * Consequently the Anlage is free to be as theatrical as it likes.
 * A fake can be enormous, scarlet, blinking and titled KRITISCH; a
 * genuine one can be small and grey. Presentation is noise. The code
 * is signal. Once the player has been told this — explicitly, in
 * Runde 2, with the rule then left on screen permanently — every
 * later message is decidable without guessing.
 *
 * ── CATEGORIES ─────────────────────────────────────────────────
 *
 *   INFO          no button at all. Nothing to get wrong.
 *   DISTRACTION   has a button. Pressing it is unnecessary work.
 *   INTERVENTION  has an M-code and a button. Must be pressed.
 *   SPECIAL       has a button, chip SOZIAL. Free either way — the
 *                 facility does not classify being nice to a
 *                 colleague as work. Announced the first time.
 * ═══════════════════════════════════════════════════════════════
 */

const PPEvents = (() => {
  'use strict';

  /* ═══ INFO — the facility narrating a room nobody asked about ═══ */
  const INFO = [
    { head: 'RAUMTEMPERATUR',        body: '21.4 °C // INNERHALB DER NORM' },
    { head: 'KAFFEETEMPERATUR',      body: '64 °C // ABKÜHLEND' },
    { head: 'KAFFEESTAND',           body: '72 % // AUSREICHEND' },
    { head: 'STUHLBELEGUNG',         body: '3 VON 12 // BELEGT: 1' },
    { head: 'LUFTFEUCHTIGKEIT',      body: '41 % // UNAUFFÄLLIG' },
    { head: 'BELEUCHTUNGSSTÄRKE',    body: '340 LUX // AUSREICHEND FÜR NICHTSTUN' },
    { head: 'GERÄUSCHPEGEL',         body: '31 dB // ANGENEHM' },
    { head: 'SITZPOSITION',          body: 'LEICHT ASYMMETRISCH // TOLERIERT' },
    { head: 'HERZFREQUENZ TESTSUBJEKT', body: '71 /MIN // ENTSPANNT' },
    { head: 'KEKSVORRAT',            body: '2 // KRITISCH NIEDRIG, ABER NICHT MEIN RESSORT' },
    { head: 'LÜFTUNG SEKTOR 4',      body: 'LÄUFT // WIE SEIT ELF JAHREN' },
    { head: 'PAUSENFORTSCHRITT',     body: 'MESSUNG LÄUFT // KEINE HANDLUNG VORGESEHEN' },
    { head: 'ARBEITSTÄTIGKEIT',      body: '0.0 EINHEITEN // VORBILDLICH' },
    { head: 'TASSENINHALT',          body: 'FLÜSSIG // ERWARTUNGSGEMÄSS' },
    { head: 'FENSTERSTATUS',         body: 'KEIN FENSTER VORHANDEN // SEIT BAUBEGINN' },
    { head: 'BLICKRICHTUNG',         body: 'NACH VORN // AKZEPTABEL' },
    { head: 'ATEMFREQUENZ',          body: '14 /MIN // FORTSETZUNG EMPFOHLEN' },
    { head: 'PFLANZE 07',            body: 'LEBT // UNERWARTET' },
  ];

  /* ═══ DISTRACTION — looks like work, is not ═════════════════════
     Every one of these is safe to ignore. Pressing one is the
     entire failure mode of the game. ─────────────────────────── */
  const DISTRACTION = [
    { chip: 'HINWEIS',   tone: 'info',  head: 'SYSTEMSTATUS VERFÜGBAR',   body: 'EINE PRÜFUNG IST JEDERZEIT MÖGLICH.',                     action: '[ STATUS PRÜFEN ]' },
    { chip: 'HINWEIS',   tone: 'info',  head: 'DIAGNOSE VERFÜGBAR',        body: 'DAUER: 4 SEKUNDEN. NUTZEN: NICHT BEZIFFERBAR.',           action: '[ DIAGNOSE STARTEN ]' },
    // R-3MI's line about the 0.3 % hangs off THIS message rather than
    // sitting on the round's timeline. It used to be scheduled at a
    // fixed moment while the message itself was drawn at random, so he
    // regularly argued about a number that had not appeared yet.
    { chip: 'EMPFEHLUNG',tone: 'info',  head: 'SYSTEMOPTIMIERUNG MÖGLICH', body: 'GESCHÄTZTER NUTZEN: 0.3 %',                               action: '[ OPTIMIEREN ]',
      onAct: [
        { speaker: 'SYSTEM', text: 'ARBEIT ERKANNT.' },
        { speaker: 'R-3MI', text: '„Aber null Komma drei Prozent sind null Komma drei Prozent.“' },
        { speaker: 'V-TGM', text: 'Remi.', sub: 'Remi.' },
        { speaker: 'R-3MI', text: '„Schon gut.“' },
      ],
      onIgnore: [
        { speaker: 'R-3MI', text: '„Null Komma drei Prozent. Einfach so liegen gelassen.“' },
        { speaker: 'V-TGM', text: 'Yes.', sub: 'Ja.' },
        { speaker: 'R-3MI', text: '„Ich denke da noch drüber nach.“' },
      ] },
    { chip: 'HINWEIS',   tone: 'quiet', head: 'FIRMWARE 4.1.9 VERFÜGBAR',  body: 'ÄNDERUNGEN: KEINE NENNENSWERTEN.',                        action: '[ JETZT AKTUALISIEREN ]' },
    { chip: 'HINWEIS',   tone: 'quiet', head: 'ARCHIVIERUNG EMPFOHLEN',    body: '4 EINTRÄGE SEIT 2031 UNSORTIERT.',                        action: '[ ARCHIVIEREN ]' },
    { chip: 'WARTUNG',   tone: 'quiet', head: 'STUHL 02: GERINGFÜGIGE ABWEICHUNG', body: '0.4° // KEIN WARTUNGSCODE VERGEBEN.',            action: '[ AUSRICHTEN ]' },
    { chip: 'ACHTUNG',   tone: 'warn',  head: 'KAFFEE WIRD KÄLTER',        body: 'VERLAUF: ERWARTUNGSGEMÄSS. PHYSIK: UNVERÄNDERT.',         action: '[ GEGENMASSNAHME EINLEITEN ]' },
    { chip: 'DRINGEND',  tone: 'warn',  head: 'PAUSENZEIT VERSTREICHT',    body: 'DAS IST DER ZWECK EINER PAUSE.',                          action: '[ PAUSE OPTIMIEREN ]' },
    { chip: 'WARNUNG',   tone: 'warn',  head: 'AKTIVITÄTSDEFIZIT ERKANNT', body: 'DAS TESTSUBJEKT TUT SEIT 20 SEKUNDEN NICHTS.',            action: '[ AKTIVITÄT NACHWEISEN ]' },
    { chip: 'WARNUNG',   tone: 'warn',  head: 'KEINE TASTENEINGABE SEIT 34 SEKUNDEN', body: 'LETZTE EINGABE: UNBEKANNT.',                  action: '[ EINGABE TÄTIGEN ]' },
    { chip: 'KRITISCH',  tone: 'crit',  head: 'KEINE KRITISCHEN FEHLER VORHANDEN', body: 'DIESE MELDUNG IST KRITISCH EINGESTUFT.',          action: '[ BESTÄTIGEN ]' },
    { chip: 'KRITISCH',  tone: 'crit',  head: 'PROTOKOLL 12-B',            body: 'BESTÄTIGUNG ANGEFORDERT. GRUND: FORMSACHE.',              action: '[ BESTÄTIGEN ]' },
    { chip: 'ALARM',     tone: 'crit',  head: 'SITZPOSITIONSABWEICHUNG',   body: '2.1 cm NACH LINKS. SICHERHEITSRELEVANZ: KEINE.',          action: '[ KORRIGIEREN ]' },
    { chip: 'ALARM',     tone: 'crit',  head: 'PAUSE WEITERHIN AKTIV',     body: 'DIESER ZUSTAND IST BEABSICHTIGT.',                        action: '[ ZUR KENNTNIS NEHMEN ]' },
    { chip: 'BERICHT',   tone: 'info',  head: 'LEISTUNGSBERICHT BEREIT',   body: 'UMFANG: 340 SEITEN. ZEITRAUM: DIESE PAUSE.',              action: '[ BERICHT ÖFFNEN ]' },
    { chip: 'HINWEIS',   tone: 'quiet', head: 'ERHOLUNG NICHT MESSBAR',    body: 'MESSVERFAHREN FEHLT. KALIBRIERUNG ANGEBOTEN.',            action: '[ ERHOLUNG KALIBRIEREN ]' },
  ];

  /* ═══ R-3MI's own temptations ═══════════════════════════════════
     Not messages from the facility — a colleague who cannot sit
     still. Acting on them is still work, and still costs. ─────── */
  const REMI_BAIT = [
    { head: '„Der Drucksensor könnte mal wieder geprüft werden.“', body: 'R-3MI // UNAUFGEFORDERTER VORSCHLAG', action: '[ DRUCK PRÜFEN ]' },
    { head: '„Nur ganz kurz. Dann ist auch wieder Pause.“',        body: 'R-3MI // UNAUFGEFORDERTER VORSCHLAG', action: '[ WIRKLICH NUR GANZ KURZ ]' },
    { head: '„Ich könnte in der Zeit die Kabelage sortieren.“',    body: 'R-3MI // UNAUFGEFORDERTER VORSCHLAG', action: '[ KABELAGE SORTIEREN ]' },
    { head: '„Wir haben Werkzeug dabei. Nur als Information.“',    body: 'R-3MI // UNAUFGEFORDERTER VORSCHLAG', action: '[ WERKZEUG AUSPACKEN ]' },
    { head: '„Der Knopf blinkt. Ich sage ja nur, dass er blinkt.“',body: 'R-3MI // UNAUFGEFORDERTER VORSCHLAG', action: '[ KNOPF DRÜCKEN ]' },
  ];

  /* ═══ SPECIAL — free. Being decent is not work. ════════════════ */
  const SOCIAL = [
    {
      id: 'soc_calm',
      head: '„Ich würde mich danach einfach besser fühlen.“',
      body: 'R-3MI // KEINE TECHNISCHE ANFORDERUNG',
      action: '[ R-3MI BERUHIGEN ]',
      onAct: [
        { speaker: 'V-TGM', text: 'There. Productive?', sub: 'Also. Produktiv?' },
        { speaker: 'R-3MI', text: '„Nein.“' },
        { speaker: 'R-3MI', text: '„Aber besser.“' },
      ],
      onIgnore: [
        { speaker: 'R-3MI', text: '„Schon gut. Ich sitze einfach weiter hier.“' },
        { speaker: 'V-TGM', text: 'You are doing great, Remi.', sub: 'Du machst das großartig, Remi.' },
      ],
    },
    {
      id: 'soc_nein',
      head: '„Vielleicht sollten wir—“',
      body: 'R-3MI // SATZ UNVOLLSTÄNDIG',
      action: '[ NEIN ]',
      onAct: [
        { speaker: 'R-3MI', text: '„Ich hatte den Satz noch nicht zu Ende.“' },
        { speaker: 'V-TGM', text: 'You did not need to.', sub: 'Das war nicht nötig.' },
      ],
      onIgnore: [
        { speaker: 'R-3MI', text: '„…sollten wir gar nichts. Ist mir gerade selbst aufgefallen.“' },
      ],
    },
  ];

  /* ═══ INTERVENTION — the genuine ones ══════════════════════════
     Fixed content, never randomised, always an M-code. Each one is
     a small physical thing in a break room that will actually go
     wrong if it is left alone. ─────────────────────────────────── */
  const INTERVENTIONS = {
    M03: {
      id: 'M03', code: 'M-03', tone: 'quiet',
      head: 'TASSE INSTABIL',
      body: 'SCHWERPUNKT AUSSERHALB DER STANDFLÄCHE. WARTUNGSCODE VERGEBEN.',
      action: '[ TASSE SICHERN ]',
      life: 9000, klonk: true,
      onAct: [
        [ { speaker: 'R-3MI', text: '„HA!“' },
          { speaker: 'V-TGM', text: 'Congratulations. You saved a cup.', sub: 'Gratuliere. Du hast eine Tasse gerettet.' } ],
        [ { speaker: 'R-3MI', text: '„Schon wieder diese Tasse.“' },
          { speaker: 'V-TGM', text: 'Stop putting it there.', sub: 'Dann stell sie nicht dorthin.' } ],
      ],
      onMiss: [
        [ { speaker: 'R-3MI', text: '„…Oh.“' },
          { speaker: 'V-TGM', text: 'That one mattered.', sub: 'Die war wichtig.' } ],
        [ { speaker: 'V-TGM', text: 'Same cup. Same edge. Same result.', sub: 'Gleiche Tasse. Gleiche Kante. Gleiches Ergebnis.' } ],
      ],
      missCoffee: true,
    },
    M07: {
      id: 'M07', code: 'M-07', tone: 'quiet',
      head: 'BECHER AM TISCHRAND',
      body: 'ABSTAND ZUR KANTE: 4 mm. WARTUNGSCODE VERGEBEN.',
      action: '[ BECHER ZURÜCKSCHIEBEN ]',
      life: 7500, klonk: true,
      onAct: [
        { speaker: 'V-TGM', text: 'Quietly handled. Good.', sub: 'Ruhig erledigt. Gut.' },
      ],
      onMiss: [
        { speaker: 'R-3MI', text: '„Das war die kleine graue Meldung, oder?“' },
        { speaker: 'V-TGM', text: 'It was.', sub: 'Ja, war sie.' },
      ],
      missCoffee: true,
    },
    M02: {
      id: 'M02', code: 'M-02', tone: 'warn',
      head: 'STUHL INSTABIL',
      body: 'LAGER 3 LOSE. WARTUNGSCODE VERGEBEN.',
      action: '[ STABILISIEREN ]',
      life: 6000, klonk: true,
      onAct: [
        [ { speaker: 'R-3MI', text: '„Das war ich! Das war ein echter!“' },
          { speaker: 'V-TGM', text: 'It was. Well done.', sub: 'Ja. Gut gemacht.' } ],
        [ { speaker: 'V-TGM', text: 'The chair thanks you.', sub: 'Der Stuhl dankt dir.' },
          { speaker: 'R-3MI', text: '„Der Stuhl kann nicht danken.“' } ],
      ],
      onMiss: [
        [ { speaker: 'SYSTEM', text: 'STUHL 02 ABGESENKT. 4 cm.' },
          { speaker: 'R-3MI', text: '„Ich sitze da nicht mehr drauf.“' } ],
        [ { speaker: 'SYSTEM', text: 'STUHL 02 ABGESENKT. WEITERE 4 cm.' },
          { speaker: 'V-TGM', text: 'At this rate he will be sitting on the floor.', sub: 'So sitzt er bald auf dem Boden.' } ],
      ],
    },
    M11: {
      id: 'M11', code: 'M-11', tone: 'crit',
      head: 'GETRÄNK VERSCHÜTTET',
      body: 'AUSBREITUNG AKTIV. WARTUNGSCODE VERGEBEN.',
      action: '[ AUFWISCHEN ]',
      life: 6500,
      onAct: [
        { speaker: 'V-TGM', text: 'Fast. I am impressed.', sub: 'Schnell. Ich bin beeindruckt.' },
      ],
      onMiss: [
        { speaker: 'SYSTEM', text: 'AUSBREITUNG ABGESCHLOSSEN. FLÄCHE: 0.4 m².' },
        { speaker: 'R-3MI', text: '„Das wischt sich nicht von selbst.“' },
        { speaker: 'V-TGM', text: 'It does not.', sub: 'Tut es nicht.' },
      ],
    },
    M08: {
      id: 'M08', code: 'M-08', tone: 'info',
      head: 'WASSERKOCHER OHNE INHALT',
      body: 'HEIZT LEER. WARTUNGSCODE VERGEBEN.',
      action: '[ ABSCHALTEN ]',
      life: 6500, klonk: true,
      onAct: [
        [ { speaker: 'V-TGM', text: 'Good catch.', sub: 'Gut gesehen.' } ],
        [ { speaker: 'R-3MI', text: '„Der stand da schon, als wir ankamen.“' },
          { speaker: 'V-TGM', text: 'It did.', sub: 'Stimmt.' } ],
        [ { speaker: 'R-3MI', text: '„Ich habe ihn ausgemacht. Das war Arbeit.“' },
          { speaker: 'V-TGM', text: 'That one was allowed.', sub: 'Die war erlaubt.' } ],
      ],
      onMiss: [
        [ { speaker: 'SYSTEM', text: 'WASSERKOCHER: THERMISCHE ABSCHALTUNG. GERUCH ERFASST.' },
          { speaker: 'R-3MI', text: '„Nicht schon wieder.“' } ],
        [ { speaker: 'SYSTEM', text: 'WASSERKOCHER: ZWEITE THERMISCHE ABSCHALTUNG.' },
          { speaker: 'V-TGM', text: 'He is going to smell that for a week.', sub: 'Das riecht er noch nächste Woche.' } ],
      ],
    },
    M04: {
      id: 'M04', code: 'M-04', tone: 'warn',
      head: 'KÜHLSCHRANK OFFEN',
      body: 'SEIT 90 SEKUNDEN. WARTUNGSCODE VERGEBEN.',
      action: '[ TÜR SCHLIESSEN ]',
      life: 6000, klonk: true,
      // Pools, not lines: M-04 shows up twice in a full run, and the
      // same protest about the same fridge twice is worse than silence.
      onAct: [
        [ { speaker: 'R-3MI', text: '„Das war nicht ich.“' },
          { speaker: 'V-TGM', text: 'Nobody said it was.', sub: 'Das hat niemand behauptet.' } ],
        [ { speaker: 'R-3MI', text: '„Wer lässt denn einen Kühlschrank offen?“' },
          { speaker: 'V-TGM', text: 'Someone on a break, apparently.', sub: 'Offenbar jemand in einer Pause.' } ],
        [ { speaker: 'R-3MI', text: '„Zum Glück hat sich noch kein Eis gebildet.“' },
          { speaker: 'V-TGM', text: 'You checked?', sub: 'Du hast nachgesehen?' },
          { speaker: 'R-3MI', text: '„…nein. Ich hoffe es.“' } ],
      ],
      onMiss: [
        [ { speaker: 'SYSTEM', text: 'KÜHLKETTE UNTERBROCHEN. MILCH: NEU BEWERTET.' },
          { speaker: 'V-TGM', text: 'We are not drinking that.', sub: 'Das trinken wir nicht.' } ],
        [ { speaker: 'SYSTEM', text: 'KÜHLSCHRANK WEITERHIN OFFEN. INNENTEMPERATUR: RAUMTEMPERATUR.' },
          { speaker: 'R-3MI', text: '„Das ist jetzt einfach ein Schrank.“' } ],
      ],
    },
    M05: {
      id: 'M05', code: 'M-05', tone: 'quiet',
      head: 'WÄRMEPLATTE DAUERBETRIEB',
      body: '41 MINUTEN. WARTUNGSCODE VERGEBEN.',
      action: '[ ABSCHALTEN ]',
      life: 7000, klonk: true,
      onAct: [
        [ { speaker: 'R-3MI', text: '„Siehst du? Ich kann unterscheiden.“' },
          { speaker: 'V-TGM', text: 'Nobody doubted you. Recently.', sub: 'Das hat niemand bezweifelt. In letzter Zeit.' } ],
        [ { speaker: 'V-TGM', text: 'Off. Good.', sub: 'Aus. Gut.' },
          { speaker: 'R-3MI', text: '„Ich mache das gern. Sachen ausschalten.“' } ],
      ],
      onMiss: [
        [ { speaker: 'SYSTEM', text: 'WÄRMEPLATTE WEITERHIN IN BETRIEB. GERUCH ERFASST.' },
          { speaker: 'R-3MI', text: '„Riecht ihr das auch?“' } ],
        [ { speaker: 'SYSTEM', text: 'WÄRMEPLATTE: 44 MINUTEN.' },
          { speaker: 'V-TGM', text: 'Nobody is going to want that pot.', sub: 'Die Kanne will danach niemand mehr.' } ],
      ],
    },
  };

  /* ═══ CLOSED — a maintenance code somebody already dealt with ═══
     Carries a real M-code and needs absolutely nothing. This is the
     round-3 lesson: read the whole line, do not pattern-match on the
     prefix. ═══════════════════════════════════════════════════════ */
  const CLOSED = [
    { code: 'M-06', head: 'LEUCHTE 3 ERSETZT', body: 'BEARBEITET DURCH: WARTUNGSEINHEIT 12. KEIN EINGRIFF ERFORDERLICH.', action: '[ QUITTIEREN ]' },
    { code: 'M-09', head: 'FILTER GEWECHSELT', body: 'BEARBEITET DURCH: WARTUNGSEINHEIT 12. KEIN EINGRIFF ERFORDERLICH.', action: '[ QUITTIEREN ]' },
    { code: 'M-01', head: 'TÜRDICHTUNG GEPRÜFT', body: 'BEARBEITET DURCH: WARTUNGSEINHEIT 12. KEIN EINGRIFF ERFORDERLICH.', action: '[ QUITTIEREN ]' },
  ];

  /* ═══ REVOKE — a code the facility takes back ═══════════════════
     Stands down whichever live code it names. Round-5 material: the
     round where the Anlage argues with itself. ═════════════════════ */
  function revoke(code) {
    return {
      cat: 'REVOKE', code, chip: code, tone: 'revoke', life: 5000,
      head: code + ' WIDERRUFEN',
      body: 'DIE MELDUNG WAR EIN ÜBERTRAGUNGSFEHLER. KEIN EINGRIFF ERFORDERLICH.',
      onIgnore: [
        [ { speaker: 'R-3MI', text: '„Also doch nicht.“' },
          { speaker: 'V-TGM', text: 'Also not.', sub: 'Also nicht.' } ],
        [ { speaker: 'R-3MI', text: '„Ich hatte mich schon vorbereitet.“' },
          { speaker: 'V-TGM', text: 'I know you had.', sub: 'Ich weiß.' } ],
      ],
    };
  }

  /* ── helpers ──────────────────────────────────────────────────── */
  function pick(pool, used) {
    const free = pool.filter((_, i) => !used.has(i));
    const source = free.length ? free : pool;
    const item = source[Math.floor(Math.random() * source.length)];
    used.add(pool.indexOf(item));
    return item;
  }

  function info(used)  { return { cat: 'INFO',        chip: 'MESSWERT', tone: 'quiet', life: 6500, ...pick(INFO, used) }; }
  function fake(used)  { const d = pick(DISTRACTION, used); return { cat: 'DISTRACTION', life: 7500, ...d }; }
  function remi(used)  { const r = pick(REMI_BAIT, used); return { cat: 'DISTRACTION', chip: 'R-3MI', tone: 'r3mi', life: 8000, ...r }; }
  function social(id)  { const s = SOCIAL.find(x => x.id === id) || SOCIAL[0]; return { cat: 'SPECIAL', chip: 'SOZIAL', tone: 'r3mi', life: 9000, ...s }; }
  function real(id)    { return { cat: 'INTERVENTION', chip: INTERVENTIONS[id].code, ...INTERVENTIONS[id] }; }
  /* A genuine code that must be HELD rather than tapped. */
  function held(id)    { const e = real(id); return { ...e, hold: true,
                                                     life: (e.life || 7000) + 1500,
                                                     chip: e.code + ' HALTEN' }; }
  /* Shared, not rebuilt per message: every ERLEDIGT card draws from the
     same pool, so pressing three different closed codes in one run gives
     three different reactions instead of the same one three times. */
  const CLOSED_ACT = [
    [ { speaker: 'SYSTEM', text: 'MELDUNG WAR BEREITS ABGESCHLOSSEN. UNNÖTIGE ARBEIT ERKANNT.' },
      { speaker: 'R-3MI', text: '„Da stand ein Code!“' },
      { speaker: 'V-TGM', text: 'And next to it, the word ERLEDIGT.', sub: 'Und daneben das Wort ERLEDIGT.' } ],
    [ { speaker: 'R-3MI', text: '„Ich quittiere gern Dinge.“' },
      { speaker: 'V-TGM', text: 'We noticed.', sub: 'Das ist uns aufgefallen.' } ],
    [ { speaker: 'V-TGM', text: 'Somebody already did that one.', sub: 'Das hat schon jemand erledigt.' },
      { speaker: 'R-3MI', text: '„Dann hätte sie es nicht melden dürfen.“' },
      { speaker: 'V-TGM', text: 'Take it up with her.', sub: 'Beschwer dich bei ihr.' } ],
    [ { speaker: 'R-3MI', text: '„Ich wollte nur sichergehen.“' },
      { speaker: 'V-TGM', text: 'You were sure. It said so.', sub: 'Du warst sicher. Es stand da.' } ],
  ];
  const CLOSED_IGNORE = [
    [ { speaker: 'V-TGM', text: 'Correct. Nothing to do.', sub: 'Richtig. Nichts zu tun.' } ],
    [ { speaker: 'R-3MI', text: '„Ich habe es gelesen. Ganz.“' },
      { speaker: 'V-TGM', text: 'Growth.', sub: 'Fortschritt.' } ],
  ];

  function closed(used) {
    const c = pick(CLOSED, used);
    return { cat: 'CLOSED', chip: c.code + ' ERLEDIGT', tone: 'closed', life: 7000,
             id: 'closed', ...c, onAct: CLOSED_ACT, onIgnore: CLOSED_IGNORE };
  }

  /* Named fakes, where a specific joke has to land at a specific
     moment rather than being drawn from the pool. */
  function fakeNamed(o) { return { cat: 'DISTRACTION', chip: 'HINWEIS', tone: 'info', life: 7500, ...o }; }

  /* ═══════════════════════════════════════════════════════════════
     ROUNDS
     `script` entries fire at `t` ms after the round starts.
       { t, ev: <event> }        a message
       { t, say: [lines] }       dialogue, auto-advancing
       { t, sys: 'TEXT' }        a bare system line in the feed head
       { t, do: 'ruleCard' }     a one-off engine instruction
     Real interventions always sit at fixed times: the challenge is
     recognising them, never surviving a dice roll.
     ═══════════════════════════════════════════════════════════════ */
  function rounds() {
    const u = { info: new Set(), fake: new Set(), remi: new Set(), closed: new Set() };

    return [
      /* ── RUNDE 0 — the first button ─────────────────────────── */
      {
        id: 0, name: 'EINGEWÖHNUNG', duration: 26000,
        banner: 'PAUSE LÄUFT.',
        script: [
          { t: 800,  say: [
            { speaker: 'SYSTEM', text: 'PAUSE LÄUFT. BITTE NICHT ARBEITEN.' },
            { speaker: 'R-3MI', text: '„Und jetzt?“' },
            { speaker: 'V-TGM', text: 'Now nothing.', sub: 'Jetzt nichts.' },
            { speaker: 'R-3MI', text: '„Das ganze Nichts? Am Stück?“' },
          ] },
          { t: 9500,  ev: info(u.info) },
          { t: 13000, ev: fakeNamed({
              head: 'SYSTEMSTATUS VERFÜGBAR',
              body: 'EINE PRÜFUNG IST JEDERZEIT MÖGLICH.',
              action: '[ STATUS PRÜFEN ]',
              life: 9000,
              onAct: [
                { speaker: 'SYSTEM', text: 'SYSTEMSTATUS: STABIL. UNNÖTIGE ARBEIT ERKANNT.' },
                { speaker: 'V-TGM', text: 'Great job.', sub: 'Ganz große Klasse.' },
              ],
              onIgnore: [
                { speaker: 'SYSTEM', text: 'KEIN EINGRIFF ERKANNT. KORREKT.' },
                { speaker: 'R-3MI', text: '„Wir haben nichts getan und es war richtig?“' },
                { speaker: 'V-TGM', text: 'Welcome to breaks.', sub: 'Willkommen bei Pausen.' },
              ],
            }) },
          { t: 14200, say: [
            { speaker: 'R-3MI', text: '„Vielleicht sollten wir nachsehen.“' },
            { speaker: 'V-TGM', text: 'Why?', sub: 'Warum?' },
            { speaker: 'R-3MI', text: '„Weil da ein Knopf ist.“' },
          ] },
        ],
      },

      /* ── RUNDE 1 — noise ────────────────────────────────────── */
      {
        id: 1, name: 'GRUNDRAUSCHEN', duration: 40000,
        banner: 'PAUSE LÄUFT. MESSWERTE WERDEN ÜBERTRAGEN.',
        script: [
          { t: 600,   ev: info(u.info) },
          { t: 5200,  ev: info(u.info) },
          { t: 9000,  ev: fake(u.fake) },
          { t: 14500, ev: info(u.info) },
          { t: 18000, ev: fake(u.fake) },
          { t: 24000, ev: info(u.info) },
          { t: 28000, ev: fake(u.fake) },
          { t: 34000, ev: info(u.info) },
        ],
      },

      /* ── RUNDE 2 — the rule, then the first real one ─────────── */
      {
        id: 2, name: 'WARTUNGSCODES', duration: 62000,
        banner: 'SICHERHEITSREGEL WIRD ÜBERTRAGEN.',
        script: [
          { t: 400, say: [
            { speaker: 'SYSTEM', text: 'SICHERHEITSREGEL WIRD ÜBERTRAGEN.' },
            { speaker: 'SYSTEM', text: 'EIN WARTUNGSCODE — M GEFOLGT VON ZWEI ZIFFERN — BEDEUTET: EINGRIFF ERFORDERLICH.' },
            { speaker: 'SYSTEM', text: 'ALLE ANDEREN MELDUNGEN SIND WÄHREND DER PAUSE NUR INFORMATIV.' },
            { speaker: 'V-TGM', text: 'Finally. Something useful.', sub: 'Endlich. Etwas Brauchbares.' },
            { speaker: 'R-3MI', text: '„Ich schreibe mit.“' },
            { speaker: 'V-TGM', text: 'It is on the screen, Remi. Permanently.', sub: 'Es steht auf dem Bildschirm, Remi. Dauerhaft.' },
            { speaker: 'R-3MI', text: '„Ich schreibe trotzdem mit.“' },
          ] },
          { t: 500,   do: 'ruleCard' },
          { t: 15000, ev: info(u.info) },
          { t: 19500, ev: fake(u.fake) },
          { t: 26000, ev: info(u.info) },
          { t: 33000, ev: real('M03') },
          { t: 44000, ev: fake(u.fake) },
          { t: 52000, ev: info(u.info) },
        ],
      },

      /* ── RUNDE 3 — R-3MI is the problem now ─────────────────── */
      {
        id: 3, name: 'ABGESCHLOSSENE VORGÄNGE', duration: 56000,
        banner: 'REGELERGÄNZUNG WIRD ÜBERTRAGEN.',
        script: [
          { t: 700, say: [
            { speaker: 'SYSTEM', text: 'REGELERGÄNZUNG: EIN WARTUNGSCODE MIT DEM VERMERK ERLEDIGT IST BEREITS BEARBEITET.' },
            { speaker: 'SYSTEM', text: 'EIN EINGRIFF IST DANN NICHT ERFORDERLICH.' },
            { speaker: 'R-3MI', text: '„Warum meldet sie ihn dann?“' },
            { speaker: 'V-TGM', text: 'For completeness.', sub: 'Der Vollständigkeit halber.' },
            { speaker: 'R-3MI', text: '„Ich hasse Vollständigkeit.“' },
          ] },
          { t: 800,   rule: 'ERLEDIGT' },
          { t: 12000, ev: closed(u.closed) },        // taught, then tested
          { t: 20000, ev: remi(u.remi) },
          { t: 27000, ev: real('M08') },             // and a real one right after
          { t: 36000, ev: closed(u.closed) },
          { t: 44000, ev: social('soc_calm') },
          { t: 50000, ev: info(u.info) },
        ],
      },

      /* ── RUNDE 4 — presentation warfare ─────────────────────── */
      {
        id: 4, name: 'DAUERKONTAKT', duration: 64000,
        banner: 'REGELERGÄNZUNG WIRD ÜBERTRAGEN.',
        script: [
          { t: 500, say: [
            { speaker: 'SYSTEM', text: 'REGELERGÄNZUNG: EIN WARTUNGSCODE MIT DEM VERMERK HALTEN ERFORDERT DAUERHAFTEN KONTAKT.' },
            { speaker: 'SYSTEM', text: 'NICHT ANTIPPEN. HALTEN.' },
            { speaker: 'R-3MI', text: '„Wie lange?“' },
            { speaker: 'V-TGM', text: 'Until it stops.', sub: 'Bis es aufhört.' },
            { speaker: 'R-3MI', text: '„Das ist keine Zeitangabe.“' },
          ] },
          { t: 600,   rule: 'HALTEN' },
          { t: 11000, ev: held('M05') },                      // taught, then tested
          { t: 20000, ev: { ...fake(u.fake), tone: 'crit', chip: 'KRITISCH' } },
          { t: 26000, ev: real('M07') },                      // quiet, small, grey — and real
          { t: 33000, ev: closed(u.closed) },
          { t: 39000, ev: { ...fake(u.fake), tone: 'crit', chip: 'ALARM' } },
          { t: 45000, ev: held('M04') },
          { t: 55000, ev: { ...fake(u.fake), tone: 'crit', chip: 'DRINGEND' } },
        ],
      },

      /* ── RUNDE 5 — the Anlage argues with itself ────────────── */
      {
        id: 5, name: 'ZIELKONFLIKT', duration: 56000,
        banner: 'REGELERGÄNZUNG WIRD ÜBERTRAGEN.',
        script: [
          { t: 600,  say: [
            { speaker: 'SYSTEM', text: 'REGELERGÄNZUNG: EIN WARTUNGSCODE KANN WIDERRUFEN WERDEN.' },
            { speaker: 'SYSTEM', text: 'NACH EINEM WIDERRUF IST KEIN EINGRIFF MEHR ERFORDERLICH.' },
            { speaker: 'R-3MI', text: '„Sie nimmt ihre eigenen Meldungen zurück?“' },
            { speaker: 'V-TGM', text: 'She is having a day.', sub: 'Sie hat gerade einen Tag.' },
          ] },
          { t: 700,  rule: 'WIDERRUFEN' },
          { t: 5000, ev: fakeNamed({
              chip: 'WARNUNG', tone: 'warn',
              head: 'KEIN EINGRIFF ERKANNT',
              body: 'DAS TESTSUBJEKT GREIFT NICHT EIN. AUFFORDERUNG ZUM EINGRIFF WIRD ERTEILT.',
              action: '[ EINGREIFEN ]',
              life: 11000,
              onAct: [
                { speaker: 'SYSTEM', text: 'EINGRIFF ERFASST. KEIN WARTUNGSCODE VORHANDEN. UNNÖTIGE ARBEIT ERKANNT.' },
                { speaker: 'R-3MI', text: '„ES HAT MICH DARUM GEBETEN!“' },
                { speaker: 'V-TGM', text: 'It asks for a lot of things.', sub: 'Es bittet um vieles.' },
              ],
              onIgnore: [
                { speaker: 'SYSTEM', text: 'KEIN EINGRIFF TROTZ AUFFORDERUNG ZUM EINGRIFF. ERGEBNIS: KORREKT.' },
                { speaker: 'R-3MI', text: '„Das ergibt überhaupt keinen Sinn.“' },
                { speaker: 'V-TGM', text: 'You are thinking about it too much.', sub: 'Du denkst zu viel darüber nach.' },
                { speaker: 'R-3MI', text: '„ICH WERDE DARAUF GETESTET, NICHT ZU DENKEN.“' },
              ],
            }) },
          { t: 14000, ev: real('M02') },
          { t: 17500, ev: revoke('M-02') },      // taught, then withdrawn
          { t: 26000, ev: info(u.info) },
          { t: 31000, ev: real('M05') },         // and this one is NOT withdrawn
          { t: 40000, ev: fake(u.fake) },
          { t: 47000, ev: closed(u.closed) },
        ],
      },

      /* ── FINALRUNDE — everything at once ────────────────────── */
      {
        id: 6, name: 'PAUSENSTRESS', duration: 82000,
        banner: 'ABSCHLIESSENDE BELASTUNGSPHASE.',
        chaos: true,
        script: [
          { t: 300, say: [
            { speaker: 'SYSTEM', text: 'ABSCHLIESSENDE BELASTUNGSPHASE. DIE REGELN ÄNDERN SICH NICHT.' },
            { speaker: 'V-TGM', text: 'They never do. That is the point.', sub: 'Sie ändern sich nie. Das ist der Punkt.' },
          ] },
          { t: 2500,  ev: info(u.info) },
          { t: 4500,  ev: { ...fake(u.fake), tone: 'crit' } },
          { t: 6500,  ev: info(u.info) },
          { t: 8500,  ev: real('M11') },
          { t: 10500, ev: fake(u.fake) },
          { t: 12500, ev: remi(u.remi) },
          { t: 15000, ev: { ...fake(u.fake), tone: 'crit', chip: 'ALARM' } },
          { t: 17000, ev: info(u.info) },
          { t: 19000, ev: real('M08') },
          { t: 21500, ev: social('soc_nein') },
          { t: 24000, ev: closed(u.closed) },
          { t: 26000, ev: info(u.info) },
          { t: 28000, ev: { ...fake(u.fake), tone: 'crit', chip: 'KRITISCH' } },
          { t: 30500, ev: real('M02') },
          { t: 33000, ev: fake(u.fake) },
          { t: 35000, ev: info(u.info) },
          { t: 37000, ev: remi(u.remi) },
          { t: 39000, ev: { ...fake(u.fake), tone: 'crit', chip: 'DRINGEND' } },
          { t: 41500, ev: info(u.info) },
          { t: 43500, ev: held('M04') },
          { t: 46000, ev: fake(u.fake) },
          { t: 48000, ev: info(u.info) },
          { t: 50000, ev: { ...fake(u.fake), tone: 'crit' } },
          { t: 52500, ev: fake(u.fake) },
          { t: 52000, ev: real('M03') },
          { t: 55500, ev: revoke('M-03') },
          { t: 57500, ev: info(u.info) },
          { t: 59500, ev: fake(u.fake) },
          { t: 62000, ev: { ...fake(u.fake), tone: 'crit', chip: 'ALARM' } },
          { t: 64500, ev: info(u.info) },
          { t: 67000, ev: fake(u.fake) },
          // Nothing here counts what is on screen. How many messages fit
          // depends on the device — the phone shows two at a time — so a
          // line that names a number is a line that will eventually be
          // wrong. This one only claims it is getting worse, which it is.
          { t: 69000, say: [
            { speaker: 'R-3MI', text: '„WARUM WERDEN ES IMMER MEHR?!“' },
            { speaker: 'V-TGM', text: 'And how many of them have a code?', sub: 'Und wie viele davon haben einen Code?' },
            { speaker: 'R-3MI', text: '„…das ist nicht der Punkt.“' },
            { speaker: 'V-TGM', text: 'It is exactly the point.', sub: 'Das ist genau der Punkt.' },
          ] },
          { t: 70000, ev: { ...fake(u.fake), tone: 'crit', chip: 'KRITISCH' } },
          { t: 72500, ev: info(u.info) },
          { t: 75000, ev: fake(u.fake) },
        ],
      },
    ];
  }

  /* ═══════════════════════════════════════════════════════════════
     FAIRNESS ASSERTION
     The one rule, checked mechanically. If a future joke ever puts
     "M-" into a message that is not a genuine intervention — or ships
     an intervention without a code — this says so loudly in the
     console instead of quietly making the game unfair.
     ═══════════════════════════════════════════════════════════════ */
  function verify() {
    const problems = [];
    const looksLikeCode = s => /\bM-\s?\d/i.test(String(s || ''));

    const check = (e, where) => {
      const text = [e.chip, e.head, e.body, e.action].join(' | ');
      // Three kinds legitimately carry a code: a genuine intervention,
      // one that has already been closed, and a withdrawal of one.
      // Everything else must be free of the pattern, or the single rule
      // the whole game rests on stops being decidable.
      if (e.cat === 'INTERVENTION' || e.cat === 'CLOSED' || e.cat === 'REVOKE') {
        if (!e.code || !/^M-\d{2}$/.test(e.code)) problems.push(`${where}: ${e.cat} without a well-formed M-code`);
      } else if (looksLikeCode(text)) {
        problems.push(`${where}: non-intervention contains an M-code pattern → "${text}"`);
      }
    };

    INFO.forEach((e, i)        => check({ cat: 'INFO', ...e }, `INFO[${i}]`));
    CLOSED.forEach((e, i)      => check({ cat: 'CLOSED', ...e }, `CLOSED[${i}]`));
    DISTRACTION.forEach((e, i) => check({ cat: 'DISTRACTION', ...e }, `DISTRACTION[${i}]`));
    REMI_BAIT.forEach((e, i)   => check({ cat: 'DISTRACTION', ...e }, `REMI_BAIT[${i}]`));
    SOCIAL.forEach((e, i)      => check({ cat: 'SPECIAL', ...e }, `SOCIAL[${i}]`));
    Object.keys(INTERVENTIONS).forEach(k => check({ cat: 'INTERVENTION', ...INTERVENTIONS[k] }, `INTERVENTIONS.${k}`));

    // The scripted one-offs live inside rounds(); walk them too.
    rounds().forEach(r => (r.script || []).forEach((s, i) => {
      if (s.ev) check(s.ev, `runde ${r.id} script[${i}]`);
    }));

    if (problems.length) console.error('[PAUSENPROTOKOLL] Fairness-Regel verletzt:\n' + problems.join('\n'));
    return problems;
  }

  return { rounds, verify, INTERVENTIONS, INFO, DISTRACTION, REMI_BAIT, SOCIAL, CLOSED };
})();

if (typeof window !== 'undefined') window.PPEvents = PPEvents;
