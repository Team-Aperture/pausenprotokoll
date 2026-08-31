# Die Kalibrierungsanlage: Pausenprotokoll

Ein kurzes Zusatzprotokoll aus der Kalibrierungsanlage. Team_Aperture.

Die Anlage hat in einem Personalarchiv Unterlagen über etwas gefunden, das dort
als **Pause** bezeichnet wird. Sie versteht, dass Pausen die Leistung angeblich
verbessern. Sie versteht nicht, wie man eine macht. Also hat sie eine
Versuchsreihe geschrieben.

Spieldauer: **10–15 Minuten.** Läuft als statische Seite, ohne Backend, ohne
Konto, ohne Datenbank.

---

## Die Kantine

Das Hauptmenü ist ein Raum. Die Kamera fährt langsam durch eine warme,
braune Kantine in Sektor 7C — Holzvertäfelung, Hängelampen mit ihren
Lichtkegeln, eine Kaffeemaschine, ein Regal mit Tassen, eine Pflanze, die
mehrere Protokolle überlebt hat. Auf einem Seitentisch steht ein Terminal
und läuft.

Auf **[ PAUSE BEGINNEN ]** erklärt erst einmal jemand, warum überhaupt
Pause ist: Die Anlage meldet den Arbeitszyklus als beendet, V-TGM weiß, was
eine Pause ist, und R-3MI kommt nicht darüber hinweg, dass ein geplanter
Vorgang keinen Inhalt haben soll. Sieben Zeilen, rund vierzehn Sekunden —
der Witz ist, dass eine Pause kurz ist und die Anlage sie lang gemacht hat;
das Intro darf das nicht auch tun.

Danach fliegt die Kamera hinein. Während des Anflugs
startet das BIOS **auf dem kleinen Bildschirm**, sodass die Anlage bereits
wach ist, wenn man ankommt. Am Ende der Fahrt übernimmt der echte,
ungescalte Monitor per Überblendung — das Spiel selbst wird nie skaliert
und bleibt gestochen scharf.

Danach läuft das Spiel **im Monitor**, mit der Kantine ringsum: warme Wand,
die Holzplatte des Tisches, das kalte Schirmlicht, das darauf zurückfällt.
Man verlässt den Raum nie ganz.

Die Glasscheibe selbst ist warm und sehr dunkel (`--screen-bg`), deutlich
abgesetzt vom helleren Gehäuse — sie gehört zu einer Kantine, nicht zu einem
Serverraum. Alles, was die Anlage *darauf* zeichnet, bleibt kaltes
KA-II-Grau, und genau dieser Kontrast macht die Arbeit:

| | Palette | Wo |
|---|---|---|
| **Die Kantine** | `--caf-*`, warm und braun | der Raum, das Gehäuse, die Scheibe |
| **Die Anlage** | KA-II-Tokens, kalt und grau | alles, was auf der Scheibe steht |

**R-3MI und V-TGM sitzen im Raum, nicht im Monitor.** Die Dialogleiste steht
auf dem Tisch davor — die beiden schauen auf den Bildschirm, sie waren nie
darin. Wo Platz ist, wird unter dem Monitor ein Streifen Kantine dafür frei
gehalten; auf kleineren Fenstern legt sich die Leiste über den unteren Rand
der Scheibe, und `dialogue.js` misst die tatsächliche Überlappung. Gemessen
wird dabei die **Ruheposition** der Leiste, nicht ihre aktuelle: Sie fährt
über 0,4 s ein, und live gemessen meldete sie während der ganzen Fahrt
„keine Überlappung", während sie die Meldungen bereits verdeckte.

Dass die beiden draußen stehen, hat sie nebenbei über *jede* Vollbildebene
gehoben, die das Spiel zeichnet — deshalb verschwinden sie nicht mehr hinter
der 10-Sekunden-Prüfung, der Auswertung und dem Abspann.

Das ist der ganze Witz in Farbe: Man sitzt in einer gemütlichen Kantine und
starrt auf ein Gerät, das die Gemütlichkeit für einen Messvorgang hält.

Die Szene ist vollständig in CSS und Inline-SVG gezeichnet — keine Fotos,
kein Ladebalken. Der einzige Bilddatei-Anteil ist das Logo.

Technisch trägt `.deck-screen` ein `transform`. Das ist keine Deko: Es macht
den Bildschirm zum Bezugsrahmen für die `position: fixed`-Ebenen des Spiels,
sodass Dialogleiste, Überlagerungen und Finale **im Monitor** bleiben,
statt über die ganze Kantine auszubrechen.

Bei `prefers-reduced-motion` entfallen Fahrt und Anflug: Der Raum steht
still, das Intro läuft gekürzt, und danach wird direkt ins Terminal
geschnitten.

### Breakpoints: zweierlei

Das Spiel wohnt nicht mehr im Fenster, sondern auf einem Monitor, der
deutlich kleiner ist als das Fenster um ihn herum. Eine `@media`-Abfrage
würde der Oberfläche weiterhin 1440 px zusprechen, während sie tatsächlich
900 hat. Deshalb:

* `@container screen` — die Oberfläche **im** Monitor, misst sich an dessen
  eigener Breite
* `@media` — der Raum: Menü, Gehäuse, Sitzabstand und die Dialogleiste

---

## Bewertung

| Rang | Name | |
|---|---|---|
| **S** | BITTE NICHT STÖREN | nur über den Netzschalter erreichbar |
| **A+** | PROFESSIONELLER NICHTSTUER | fehlerfreier Durchlauf |
| **A** | VOLLSTÄNDIG ERHOLT | kein Eingriff verpasst |
| **B** | LEICHT ARBEITSSÜCHTIG | Freigabeschwelle |
| **C** | PAUSE NICHT VERSTANDEN | keine Zieldaten |
| **D** | R-3MI | keine Zieldaten |

Es gibt genau **ein** S, und das bekommt man nicht durchs Spielen. Unterhalb
von **B** gilt die Pause als nicht bestanden und die Anlage rückt die
Koordinaten nicht heraus — eine Wiederholung ist jederzeit möglich.

Auf dem Hauptmenü listet **[ ERFOLGE ]** alle Auszeichnungen, erreichte wie
offene, über Durchläufe hinweg gespeichert. Eine davon nennt ihre Bedingung
nicht — es ist ein geheimes Ende, und eine Erfolgsliste, die verrät, wie man
es erreicht, ist eine Komplettlösung.

---

## Zieldaten

Am Ende des Abspanns stehen die Koordinaten, wie im Rest der Reihe: sichtbar,
zum Kopieren antippbar, und im Repository bewusst als Platzhalter
(`N 00° 00.000 · E 000° 00.000`) — erkennbar keine echte Position, damit
niemand versehentlich losfährt. Der Block ist in `js/results.js` mit
`▼▼▼ ECHTE CACHE-KOORDINATEN HIER EINTRAGEN ▼▼▼` markiert.

---

## Der Netzschalter

Das kleine grüne Lämpchen auf dem Schild unter dem Monitor ist ein echter
Schalter. **Gedrückt halten**, und der Bildschirm geht aus.

Die Anlage verbucht das als Abbruch des Protokolls. Es ist gleichzeitig die
einzige vollständig richtige Antwort, die ihr das ganze Spiel über jemand
gegeben hat: Eine Pause ist ein Zeitraum, in dem man nicht erreichbar ist,
und das Testsubjekt hat sich soeben unerreichbar gemacht. Also: **Rang S —
BITTE NICHT STÖREN**.

Und **keine Koordinaten.** Das Protokoll wurde tatsächlich nie abgeschlossen,
und die Anlage ist nicht sentimental. Sie hält das für fair.

Gedrückt halten statt klicken, aus demselben Grund, aus dem echte Monitore
das so machen: Einen Durchlauf durch Streifen eines 6-px-Lämpchens zu beenden
wäre ein Fehler, kein Easter Egg. Auch per Tastatur (Enter/Leertaste halten).
Die Auswertung wandert dabei aus dem Monitor **in den Raum** — dort ist als
Einziges noch Licht an.

---

## Musik

Die Datei liegt unter `assets/music/kantine-loop.mp3` — zum Wechseln einfach
ersetzen, der Code kennt nur diesen Pfad. Ein kurzer Loop (30–60 s) reicht
völlig: Der Track wird gefiltert, geduckt und geblendet, er muss die Szene
nicht allein tragen.

Ein Loop, durch den Web-Audio-Graph geführt, damit er geformt statt nur
lauter und leiser gemacht werden kann:

* **Gedämpft** im Menü (Tiefpass bei 380 Hz) — der Track klingt, als käme er
  durch die Kantinenwand. Beim Start der Pause öffnet der Filter auf 16 kHz,
  und der Raum öffnet sich mit.
* **Duckt** automatisch unter Dialog. Die Piepser von R-3MI und V-TGM sind
  absichtlich leise; statt sie lauter zu drehen — was sie nörgelig machen
  würde — geht die Musik aus dem Weg, solange jemand spricht. Die Stimmen
  selbst wurden zusätzlich leicht angehoben.
* **Gedämpft** auch auf der Auswertung — wie im Menü, weil beides Momente zum
  Lesen sind und nicht zum Drinsein.
* **Verstummt** für die Abschlusskalibrierung. Der Brief ist da eindeutig:
  Stille ist dort Spielmechanik. Der Track verschwindet ganz und kommt zur
  Auswertung zurück.

Der Tonschalter besitzt alles — Musik, SFX und Brummen.

---

## Die Mechanik

Der Spieler muss lernen, wann er **nicht** reagieren soll.

Die Anlage sendet Warnungen, Hinweise, Störungen, blinkende Schaltflächen und
scheinbare Notfälle. Die meisten davon erfordern nichts. Einige wenige schon.

**Die eine Regel, ab Runde 2 dauerhaft auf dem Bildschirm:**

> Eine Meldung erfordert genau dann einen Eingriff, wenn sie einen
> Anlagencode trägt — und der **Buchstabe** des Codes sagt, welchen.
> Meldungen ohne Code sind während der Pause nur informativ.

Ob Farbe, Größe und Lautstärke etwas bedeuten, steht **nirgends im Spiel**.
Das darf der Spieler selbst herausfinden — es ist ein Trollspiel, und die
Erkenntnis ist der halbe Spaß.

Damit das kein Ratespiel wird, ist die Regel **strukturell erzwungen** und nicht
von Hand gepflegt: `PPEvents.verify()` in `js/events.js` läuft bei jedem Start
und prüft, dass keine Nicht-Intervention irgendwo das Muster `M-<Ziffer>`
enthält und dass jede Intervention einen wohlgeformten Code trägt. Ein neuer
Witz, der die Regel bricht, meldet sich sofort in der Konsole.

### Die Codefamilie

| Code | Bedeutung | Was zu tun ist |
|---|---|---|
| `N-NN` | **N**ormal | drücken |
| `H-NN` | **H**alten | gedrückt halten |
| `E-NN` | **E**rledigt | nichts |
| `W-NN` | **W**iderruf | nichts — hebt einen früheren Code auf |

### Die Regeln kommen nach und nach

Runde 2 lehrt die Grundregel. Danach ergänzt die Anlage sie dreimal, jeweils
**vor** der Runde, die sie prüft — eine Regel, die man zum ersten Mal als Strafe
kennenlernt, wäre ein Gotcha, und die macht dieses Spiel nicht.

| Runde | Neue Regel | Was sie bringt |
|---|---|---|
| 3 | **E-NN** | Ein Code, der bereits bearbeitet wurde. Trägt einen echten Code und braucht **nichts**. |
| 4 | **H-NN** | Ein Code, der dauerhaften Kontakt verlangt. Antippen genügt nicht — und wird auch nicht bestraft, sondern erklärt. |
| 5 | **W-NN** | Die Anlage nimmt eine eigene Meldung zurück. Danach ist ein Eingriff unnötige Arbeit. |

Runde 6 ist der Parcours und benutzt alles davon gleichzeitig.

Ein Buchstabe trägt die ganze Entscheidung. Bei ruhigem Bildschirm ist das
trivial; bei einer Meldung alle 2,5 Sekunden ist es das ganze Spiel. Die
Darstellung einer Meldung wird dabei **zufällig** gezogen — auch bei `E-NN`,
denn ein erledigter Code, der immer grau aussähe, wäre erkennbar, ohne ihn zu
lesen, und genau das Lesen ist der Punkt.

### Kategorien

| Kategorie      | Chip     | Schaltfläche | Richtige Reaktion | Bei Fehler |
|----------------|----------|--------------|-------------------|------------|
| `INFO`         | MESSWERT | keine        | nichts tun        | — |
| `DISTRACTION`  | frei     | ja           | ignorieren        | Drücken: −5 % |
| `INTERVENTION` | `N-NN`   | ja           | drücken           | Verstreichen lassen: −8 % |
| `INTERVENTION` | `H-NN`   | ja           | **halten**        | Verstreichen lassen: −8 % |
| `CLOSED`       | `E-NN`   | ja           | ignorieren        | Drücken: −5 % |
| `REVOKE`       | `W-NN`   | nein         | —                 | stellt einen laufenden Code still |
| `SPECIAL`      | SOZIAL   | ja           | freie Wahl        | folgenlos |

`SOZIAL` gilt nicht als Arbeit — die Anlage stuft Zuwendung gegenüber R-3MI
nicht als Tätigkeit ein. Das wird beim ersten Auftreten angesagt und steht
danach in der Regelkarte.

Ein Fehler beendet nichts. Er kostet Stabilität, erzeugt die besseren Dialoge
und der Versuch läuft weiter. Jeder Durchlauf erreicht das Ende.

### Ablauf

Kantine → Intro → Anflug → sieben Runden (Eingewöhnung, Grundrauschen, Anlagencodes,
Abgeschlossene Vorgänge, Dauerkontakt, Zielkonflikt, Pausenstress) →
Abschlusskalibrierung → Auswertung → Abspann.

Die Abschlusskalibrierung ist **zehn Sekunden nichts tun.** Nach drei Sekunden
erscheint eine Schaltfläche, nach fünf ändert sie ihre Beschriftung, nach sieben
pulsiert sie. Ein Druck darauf setzt den Zähler zurück — ohne Abzug. Das ist
Strafe genug.

---

## Verwandtschaft zu KA-II

Pausenprotokoll übernimmt die Designsprache von *Die Kalibrierungsanlage II:
Die Reaktivierung* — nicht als Annäherung, sondern als dieselben Werte:

* die vollständige `:root`-Token-Palette aus KA-IIs `css/global.css`
  (`--bg-deep #04080c`, `--accent-r3mi #2ecf62` grün, `--accent-vtgm #c0322c`
  rot, `--accent-system`, `--accent-warn`, Text- und Rahmenstufen)
* dieselben drei Schriften: Share Tech Mono, Rajdhani, Barlow
* dieselbe Abstandsskala (4/8/16/32/64) und dieselben Übergangszeiten
* `.bg-grid` / `.bg-scanlines` / `.bg-vignette`, die Systemleiste, das
  Boot-Terminal, das Panel-Vokabular
* die Dialogleiste mit den animierten SVG-Einheiten — R-3MI als einäugiger
  Humanoid mit unruhigem Blick, V-TGM als Kugel mit Reagenzglas und ruhigem
  Blick
* die prozedurale Web-Audio-Architektur ohne Audiodateien
* Reduced-Motion-, Fokus- und Speichermuster

**Bewusst nicht übernommen:** Kapitelstruktur, Sektorkarte, Zugangsschleuse,
Signalnischen, Kalibrierungsfragmente, portable Speichercodes, Gastfiguren, das
Point-and-Click-Szenensystem — und die Mobil-Warnung, denn hier ist das Telefon
eine vollwertige Plattform.

**KA-II selbst wurde nicht verändert.**

---

## Stabile Hitboxen

In KA-IIs Kapitel 0 wurden die Ringtasten per `transform: translate(...)`
positioniert, und der Pressed-State deklarierte `transform` erneut — was die
Positionierung **ersetzte**. Die Schaltfläche sprang zwischen `pointerdown` und
`pointerup` unter dem Zeiger weg, und der Klick ging mitunter verloren.

Für dieses Projekt gilt deshalb ausnahmslos:

> Ein Zustand (`:hover`, `:focus-visible`, `:active`, `.hit`) darf ein
> interaktives Element niemals verschieben, skalieren oder anderweitig
> transformieren. Nur eine innere Ebene reagiert.

Jede Schaltfläche ist ein nacktes, fest dimensioniertes Klickziel. Rahmen,
Hintergrund und Druckreaktion sitzen auf einem eingelassenen `::before` bei
`z-index: -1` innerhalb eines eigenen Stacking-Kontexts (`isolation: isolate`).
Die sichtbare Fläche darf sich stauchen; das Klickziel bewegt sich nicht.

Das ist hier wichtiger als irgendwo sonst in der Reihe: Das ganze Spiel ist eine
Entscheidung darüber, ob man eine Schaltfläche drückt. Ein verlorener Klick
würde sich anfühlen, als würde das Spiel schummeln.

Auch die Schaltfläche der Abschlusskalibrierung hat eine **feste** Breite, nicht
nur eine Mindestbreite — ihre Beschriftung ändert sich, während der Spieler sie
anstarrt.

Ein zweiter Fallstrick derselben Familie: Eine laufende CSS-Animation schlägt im
Kaskadenrang eine normale Deklaration. Der pulsierende Köder verschluckte damit
den Tastaturfokusring — ausgerechnet auf den Schaltflächen, bei denen das Spiel
am meisten möchte, dass man vor der Entscheidung hinsieht. Fokus und Druck
halten die Animation deshalb an, statt gegen sie anzutreten.

---

## Wie die Zusage gehalten wird

**Jede Schaltfläche einer offenen Meldung ist ohne Scrollen erreichbar.** Das
ist keine Messung mehr, die zufällig gehalten hat, sondern eine Eigenschaft
des Spiels:

* Wie viele Meldungen gleichzeitig erscheinen dürfen, wird **gemessen** statt
  geraten. Früher hing das an der Fensterbreite — nur ein Näherungswert, denn
  die eigentliche Grenze ist, wie viel Platz die Meldungsspalte tatsächlich
  unter sich hat. Ein 1024×768-Fenster war breit genug für drei Karten und
  hatte Platz für eine.
* Der Deckel bestimmt nur das **Tempo**. Die Zusage hält `trimToFit()`: Der
  Stapel wird viermal pro Sekunde und nach jeder neuen Meldung geprüft und
  gekürzt, sobald seine unterste Schaltfläche unter den Rand rutscht — etwa
  weil die Regelkarte um eine Zeile gewachsen ist, die Dialogleiste
  hochgefahren ist oder jemand das Fenster verkleinert hat.
* Gekürzt wird nach Wert: zuerst **erledigte Karten** (die sind Quittungen),
  dann Rauschen, ältestes zuerst. Ein echter Code wird **nie** entfernt — er
  ist das, was das Kürzen schützt. Und die Reihenfolge wird nie zugunsten
  echter Codes umsortiert: Position darf nichts verraten.

Gemessen über volle Sitzungen auf 360×640, 360×740, 414×896, 768×1024,
1024×768, 1280×720, 1366×768, 1440×900, 1600×900 und 1920×1080: **keine
einzige Schaltfläche unter dem Falz.**

Auf kurzen Fenstern weicht dafür der Raum: Unter 820px Höhe schrumpfen
Sitzabstand und Tischband, damit der Monitor genug Platz behält — Spiel vor
Kulisse.

---

## Bedienung, Barrierefreiheit

* Tastatur: alles per Tab erreichbar, deutlich sichtbarer Fokusring, `Enter` /
  `Leertaste` lösen aus, `Esc` schließt Überlagerungen
* Touch: Ziele mindestens 44 × 44 px, auf dem Telefon volle Breite,
  `touch-action: manipulation`, keine Hover-Abhängigkeit
* Keine Information ausschließlich über Farbe — ein echter Eingriff **schreibt**
  seinen Code hin
* `prefers-reduced-motion` schaltet Animationen ab; der Köder bleibt sichtbar
  hervorgehoben, statt zu verschwinden
* Zustandsänderungen laufen über eine `aria-live`-Region
* Ton ist optional und nie lösungsnotwendig

Auf dem Telefon schrumpft der Kantinenrahmen auf 4 px: Die Spielfläche geht
vor. Wie die Erreichbarkeits-Zusage gehalten wird, steht oben.

Die Reihenfolge der Meldungen wird dabei **nie** zugunsten echter Codes
umsortiert. Position darf nichts verraten.

---

## Ton

Prozedurales Web Audio, keine Dateien. Ein globaler Schalter, der gemerkt wird.

`KLONK` ist reserviert: etwas Physisches in der Anlage hat sich verändert — eine
gesicherte Tasse, ein stabilisierter Stuhl, eine eingeblendete Regeltafel. Eine
Schaltfläche, die nur den Bildschirm ändert, bekommt ein gewöhnliches Klicken.

Echte Eingriffe klingen anders als Fehlmeldungen (ein steigender Zweiklang
gegen einen flachen Piepser). Das ist eine Zugabe, keine Voraussetzung — der
Code steht auf der Karte.

Die Abschlusskalibrierung wird **wirklich still.** Der Anlagenbrumm fährt
herunter und es gibt sieben Sekunden lang nichts zu hören. Stille ist hier
Spielmechanik.

---

## Aufbau

```
index.html
favicon.svg
assets/
  logo.png/.webp  das Logo, freigestellt
  music/          der Loop
css/
  base.css        Tokens, Reset, Schaltflächensystem (stabile Hitboxen)
  cafeteria.css   Kantine, Kamerafahrt, Anflug, Monitorrahmen
  facility.css    Systemleiste, Boot, Panels, Dialogleiste, Einheiten, Toasts
  game.css        Statusleiste, Meldungen, Abschlusskalibrierung, Auswertung
  responsive.css  Breakpoints und Reduced Motion
js/
  audio.js        prozedurales Web Audio, Brumm, KLONK
  music.js        Loop, Dämpfung, Ducking, Stille
  boot.js         das BIOS — läuft im Monitor und in voller Größe
  cafeteria.js    Kamerafahrt und Anflug
  state.js        Einstellungen, kleiner Wiederaufnahmepunkt, Auszeichnungen
  dialogue.js     R-3MI / V-TGM / SYSTEM, animierte Gesichter, Untertitel
  events.js       Meldungsdaten, Rundenskripte, Fairness-Prüfung
  game.js         Rundenlauf, Bewertung, die zehn Sekunden
  power.js        der Netzschalter am Monitor
  results.js      Auswertung, Rang, Auszeichnungen, Abspann, Zieldaten
  app.js          Menü und Verdrahtung
```

Keine Frameworks, kein Build-Schritt. `index.html` in einem Browser öffnen oder
über GitHub Pages ausliefern.

## Speicherung

Ein `localStorage`-Schlüssel (`pp_state_v1`): Tonschalter, ein kleiner
Wiederaufnahmepunkt auf Rundengrenze, die verdienten Auszeichnungen. Keine
Verbindung zum KA-II-Spielstand. Ein Browser, der nichts speichert, wird
erkannt, gemeldet und spielt normal weiter.

## Figuren

**R-3MI** spricht Deutsch, findet Pausen theoretisch gut und ist praktisch
außerstande, eine zu machen. **V-TGM** spricht Englisch mit deutschem
Untertitel, wartet deutlich besser ab und kommentiert trocken.

Keine Gäste. Keine Sprachaufnahmen. Keine Enthüllungen. Die Anlage hat aus
irgendeinem Grund entschieden, dass auch Pausen kalibriert werden müssen — mehr
passiert hier nicht.
