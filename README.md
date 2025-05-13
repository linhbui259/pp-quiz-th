# Interaktives Karten-Quiz Deutschland

Ein einfaches, interaktives Quizspiel, bei dem der Benutzer aufgefordert wird, deutsche Bundesländer auf einer Karte anzuklicken. Dieses Projekt wurde als Übung zur Verwendung von HTML, CSS, JavaScript und der Leaflet.js-Bibliothek für interaktive Karten erstellt.

## Funktionen

*   Anzeige einer interaktiven Karte von Deutschland (mit stark vereinfachten GeoJSON-Daten).
*   Zufällige Fragen, bei denen der Benutzer ein bestimmtes Bundesland auf der Karte finden muss.
*   Visuelles Feedback für richtige und falsche Antworten direkt auf der Karte.
*   Zählung der Punktzahl.
*   Möglichkeit, das Quiz neu zu starten.

## Verwendete Technologien

*   HTML5
*   CSS3
*   JavaScript (ES6+)
*   [Leaflet.js](https://leafletjs.com/) - Eine Open-Source-JavaScript-Bibliothek für mobilfreundliche interaktive Karten.
*   (Beispielhafte) GeoJSON-Daten zur Darstellung der Bundesländer.

## Setup & Start

### Voraussetzungen

*   Ein moderner Webbrowser (z.B. Chrome, Firefox, Edge, Safari).
*   Python 3 (optional, für den einfachen lokalen Webserver). Alternativ kann jeder andere lokale Webserver verwendet werden.

### 1. Dateien herunterladen/klonen

Laden Sie die Projektdateien herunter oder klonen Sie das Repository (falls es sich in einem Git-Repository befindet) in ein lokales Verzeichnis auf Ihrem Computer.
Die Struktur sollte wie folgt aussehen:

```
projekt-ordner/
├── index.html
├── styles.css
├── script.js
├── geojsonData.json
└── README.md
```

### 2. Lokalen Webserver starten

Da die Anwendung GeoJSON-Daten über die `fetch`-API lädt, muss sie über einen Webserver ausgeliefert werden, um Sicherheitsbeschränkungen des Browsers (Same-Origin Policy) beim direkten Öffnen von lokalen `file://`-Dateien zu umgehen.

**Mit Python (empfohlen für einfache Tests):**

1.  Öffnen Sie ein Terminal oder eine Kommandozeile.
2.  Navigieren Sie in das Hauptverzeichnis Ihres Projekts (den `projekt-ordner`).
3.  Führen Sie den folgenden Befehl aus:

    ```bash
    python -m http.server 8000
    ```

    (Wenn Sie Python 2 verwenden, lautet der Befehl `python -m SimpleHTTPServer 8000`)

4.  Der Server startet und ist normalerweise unter `http://localhost:8000` erreichbar.

**Andere lokale Webserver:**

Sie können auch andere lokale Webserver-Tools wie den [Live Server für VS Code](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer), XAMPP, MAMP, etc. verwenden.

### 3. Anwendung im Browser öffnen

Öffnen Sie Ihren Webbrowser und navigieren Sie zu der Adresse, die Ihr lokaler Webserver anzeigt (z.B. `http://localhost:8000`).

Das Quiz sollte nun geladen werden und spielbar sein.

## Wichtiger Hinweis zu GeoJSON-Daten

Die in diesem Projekt verwendete `geojsonData.json`-Datei enthält **stark vereinfachte Platzhalter-Polygone** und repräsentiert nicht die tatsächlichen geografischen Grenzen der Bundesländer. Für eine genaue Darstellung müssten Sie echte GeoJSON-Daten für deutsche Bundesländer verwenden, die aus öffentlich zugänglichen Quellen bezogen werden können.

## Mögliche zukünftige Erweiterungen

*   Verwendung detaillierter und korrekter GeoJSON-Daten.
*   Hinzufügen weiterer Bundesländer und/oder Länder.
*   Implementierung verschiedener Schwierigkeitsgrade.
*   Zoom auf das korrekte Bundesland nach der Antwort.
*   Verbesserung des User Interface und User Experience.
*   Hinzufügen von Soundeffekten.
*   Speichern von Highscores (z.B. im LocalStorage).

## Beitrag

Da dies ein einfaches Demonstrationsprojekt ist, werden Beiträge derzeit nicht aktiv gesucht. Bei Fragen oder Anregungen können Sie jedoch gerne ein Issue erstellen (falls in einem Repository). 