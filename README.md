# ScreenSteps

`ScreenSteps` ist eine lokale Chrome-Erweiterung auf Basis von Manifest V3. Sie zeichnet relevante Nutzerinteraktionen auf Webseiten auf, erstellt nach jedem Schritt einen Screenshot des sichtbaren Tabs, markiert die betroffenen UI-Elemente im Bild und exportiert das Ergebnis als Markdown-, HTML- oder PDF-tauglichen Report.

## Features

- Reduziertes Popup nur mit `Record starten`, `Record stoppen`, `Verwalten` und knappen Statushinweisen
- Erfassung sinnvoller Nutzeraktionen: Klicks, Texteingaben, Checkboxen, Radios und Dropdowns
- Wahl zwischen deutscher und englischer Dokumentationssprache in der Verwaltung
- Die Sprache der Erweiterung selbst kann zwischen Deutsch und Englisch umgestellt werden
- Die gewaehlte Dokumentationssprache und UI-Sprache werden lokal gemerkt
- Automatische Screenshots per `chrome.tabs.captureVisibleTab`
- Automatischer Startschritt mit initialem Screenshot direkt beim Beginn der Aufnahme
- Visuelle Markierung des geklickten oder geaenderten Elements direkt im Screenshot
- Interne Metadaten fuer robuste Wiedererkennbarkeit von Elementen
- Schrittbeschreibungen bevorzugen lesbare Labels statt voller URLs oder technischer IDs
- Seitentitel werden fuer Archiv und Exporte moeglichst aktuell gehalten
- Die Aufnahme wird beim Wechsel auf einen anderen Tab bewusst beendet, damit keine falschen Screenshots entstehen
- Kompakte Statusanzeige im Popup, alles Weitere in der Verwaltung
- Markdown-Export als ZIP mit `README.md` und separatem `images/`-Ordner
- HTML-Export als ZIP mit `index.html` und separatem `images/`-Ordner
- Confluence-Ready-Export als selbstenthaltene HTML-Datei fuer Copy-Paste nach Confluence
- Druckansicht fuer den Browser-Dialog `Als PDF speichern`
- Verwaltungspage fuer alle gespeicherten Recordings mit Detail-, Listen- und Rasteransicht
- Bearbeitungsmodus in der Verwaltung fuer Titel, Schritttexte, Reihenfolge und das Entfernen einzelner Schritte

## Projektstruktur

```text
ScreenSteps/
  manifest.json
  README.md
  manager/
    manager.html
    manager.css
    manager.js
  preview/
    preview.html
    preview.js
  popup/
    popup.html
    popup.css
    popup.js
  src/
    background.js
    content-script.js
    export-utils.js
```

## Installation in Chrome

1. `chrome://extensions` in Chrome oeffnen.
2. Den Schalter `Entwicklermodus` aktivieren.
3. Auf `Entpackte Erweiterung laden` klicken.
4. Den Ordner `ScreenSteps` aus diesem Workspace auswaehlen.

## Kurzer Testablauf

1. Eine normale `http`- oder `https`-Webseite oeffnen.
2. Optional zuerst `Verwalten` oeffnen und dort `Sprache der Erweiterung` sowie `Dokumentationssprache` auf `Deutsch` oder `English` setzen.
3. Die Erweiterung anklicken und `Record starten` waehlen.
4. Auf der Webseite einige Buttons, Links oder Formularfelder bedienen.
5. Die Erweiterung erneut oeffnen und `Record stoppen` klicken.
6. Ueber `Verwalten` kannst du anschliessend Exporte starten, zwischen `Detail`, `Liste` und `Raster` wechseln und gespeicherte Schritte bearbeiten.

## Exportformate

- `Markdown`: Erstellt in `Downloads` eine ZIP-Datei. Darin liegt ein Ordner mit `README.md` und allen Screenshots unter `images/`
- `HTML`: Erstellt in `Downloads` eine ZIP-Datei mit `index.html` und allen Bildern unter `images/`
- `Confluence Export`: Erstellt in `Downloads` eine einzelne HTML-Datei mit eingebetteten Bildern, die fuer Copy-Paste nach Confluence vorbereitet ist
- `PDF`: Ueber die integrierte Druckansicht und den Browser-Dialog `Als PDF speichern`

## Wichtige Hinweise

- Screenshots enthalten nur den sichtbaren Bereich des aktiven Tabs.
- Scrollbalken werden vor einem Screenshot kurz ausgeblendet, damit sie nicht in der Doku auftauchen.
- Wenn du waehrend eines laufenden Recordings auf einen anderen Tab wechselst, beendet die Erweiterung die Aufnahme absichtlich.
- Die Erweiterung nutzt `chrome.storage.local`. Sehr lange Sessions mit vielen Screenshots koennen dadurch speicherintensiv werden.
- Fuer Screenshots ist `unlimitedStorage` aktiviert, damit die lokale Speicherquote nicht frueh blockiert.
- Chrome-interne Seiten wie `chrome://` koennen nicht aufgezeichnet werden.
- Die PDF-Erstellung nutzt bewusst den Browser-Druckdialog statt eines separaten Backends oder nativen PDF-Generators.
- Fuer den Markdown-Ordner-Export nutzt die Erweiterung die Chrome-Downloads-API.
- Die Sprache wirkt sich auf Schritttexte sowie auf Markdown-, HTML- und PDF-Reports aus.
- Englische Reports nutzen auch englisch formatierte Zeitangaben.
- Die Erkennung ist bewusst pragmatisch gehalten und priorisiert einen stabilen MVP statt perfekter Semantik.
