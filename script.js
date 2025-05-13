let map;
// geojsonLayer wird nicht mehr für die Hauptinteraktion benötigt, aber wir könnten es für die Anzeige der Umrisse behalten
// let geojsonLayer; 
let score = 0;
let currentQuestionData = null; // Speichert das aktuell gesuchte Bundesland-Objekt
let featuresToAsk = []; // Array der Features, die noch abgefragt werden müssen
let allFeaturesData = []; // Speichert alle geladenen Features für den Neustart
let markersLayer = L.layerGroup(); // Layer-Gruppe für unsere Marker

// HTML-Elemente abrufen
const questionDisplay = document.getElementById('question-display');
const questionImage = document.getElementById('question-image');
const questionTextContent = document.getElementById('question-text-content');
const scoreDisplay = document.getElementById('score');
const nextButton = document.getElementById('next-btn');

// Benutzerdefinierte Icons für Marker (optional, aber verbessert das Feedback)
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    // shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', // Oft von Leaflet automatisch gehandhabt
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Temporär auskommentiert für Testzwecke
/*
const correctIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const incorrectIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
*/

// Verwende defaultIcon für alle Fälle zu Testzwecken
const correctIcon = defaultIcon; 
const incorrectIcon = defaultIcon;

// Initialisiert die Karte
function initMap() {
    map = L.map('map').setView([51.1657, 10.4515], 6); // Zentrum Deutschland, Zoom 6
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    markersLayer.addTo(map); // Fügt die Marker-Layer-Gruppe zur Karte hinzu
    loadAndDisplayMarkers();
}

// Lädt die GeoJSON-Daten und erstellt Marker
async function loadAndDisplayMarkers() {
    try {
        const response = await fetch('geojsonData.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        allFeaturesData = data.features; // Speichert alle Features für den Neustart
        
        resetQuiz(); // Startet das Quiz nach dem Laden der Daten
    } catch (error) {
        console.error("Fehler beim Laden der GeoJSON-Daten:", error);
        questionDisplay.textContent = "Fehler beim Laden der Kartendaten.";
    }
}

function createMarkers() {
    markersLayer.clearLayers(); // Entfernt alte Marker, falls vorhanden

    allFeaturesData.forEach(feature => {
        if (feature.properties && feature.properties.centroid) {
            const marker = L.marker(feature.properties.centroid, { icon: defaultIcon });
            marker.featureData = feature.properties; // Speichert die Daten des Features im Marker
            marker.on('click', onMarkerClick);
            markersLayer.addLayer(marker);
        }
    });
}

// Wird aufgerufen, wenn auf einen Marker geklickt wird
function onMarkerClick(e) {
    if (!currentQuestionData || !currentQuestionData.properties) { // Zusätzliche Prüfung für properties
        console.warn("onMarkerClick aufgerufen, aber currentQuestionData ist nicht korrekt gesetzt.");
        return; 
    }

    const clickedMarker = e.target;
    const clickedFeatureName = clickedMarker.featureData.name;

    disableMapClicks(true); 
    nextButton.disabled = false;

    const correctFeatureName = currentQuestionData.properties.name; // Korrekter Zugriff

    if (clickedFeatureName === correctFeatureName) {
        score++;
        scoreDisplay.textContent = `Punkte: ${score}`;
        questionTextContent.textContent = `Richtig! Das ist ${correctFeatureName}.`;
        clickedMarker.setIcon(correctIcon); 
    } else {
        questionTextContent.textContent = `Falsch. Das war ${clickedFeatureName}. Gesucht war ${correctFeatureName}.`;
        clickedMarker.setIcon(incorrectIcon); 

        markersLayer.eachLayer(marker => {
            if (marker.featureData.name === correctFeatureName) {
                marker.setIcon(correctIcon); 
            }
        });
    }
    currentQuestionData = null; // Verhindert doppeltes Antworten
}

// (De-)Aktiviert Klick-Events auf den Markern
function disableMapClicks(disabled) {
    markersLayer.eachLayer(marker => {
        if (disabled) {
            marker.off('click', onMarkerClick);
        } else {
            // Stelle sicher, dass der Event-Handler nicht mehrfach hinzugefügt wird
            marker.off('click', onMarkerClick); // Erst entfernen
            marker.on('click', onMarkerClick);  // Dann hinzufügen
        }
    });
}


// Mischt ein Array (Fisher-Yates Shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Generiert eine neue Frage
function generateQuestion() {
    resetMarkerStyles(); // Setzt Icons aller Marker zurück
    disableMapClicks(false); // Aktiviert Klicks auf Marker

    if (featuresToAsk.length === 0) {
        questionTextContent.textContent = `Quiz beendet! Endpunktzahl: ${score} von ${allFeaturesData.length}.`;
        questionImage.style.display = 'none';
        nextButton.textContent = "Neu starten";
        nextButton.disabled = false; // Button für Neustart aktivieren
        currentQuestionData = null;
        return;
    }

    // Nimm das nächste Element aus dem gemischten Array
    currentQuestionData = featuresToAsk.pop(); 
    
    // Korrekter Zugriff über das 'properties'-Objekt
    if (currentQuestionData && currentQuestionData.properties) {
        questionTextContent.textContent = `Klicke auf: ${currentQuestionData.properties.name}`;
        if (currentQuestionData.properties.imageUrl) {
            questionImage.src = currentQuestionData.properties.imageUrl;
            questionImage.alt = `Wappen von ${currentQuestionData.properties.name}`;
            questionImage.style.display = 'block';
        } else {
            questionImage.style.display = 'none'; // Bild ausblenden, wenn keine URL vorhanden
        }
    } else {
        console.error("Fehler: Ungültige Fragendaten oder fehlende Properties", currentQuestionData);
        questionTextContent.textContent = "Fehler beim Laden der Frage.";
        questionImage.style.display = 'none';
        currentQuestionData = null; // Verhindern, dass mit ungültigen Daten weitergemacht wird
    }
    
    nextButton.textContent = "Nächste Frage";
    nextButton.disabled = true; // Deaktiviere "Nächste Frage" bis eine Antwort gegeben wurde
}

// Setzt die Icons aller Marker auf den Standard zurück
function resetMarkerStyles() {
    markersLayer.eachLayer(marker => {
        marker.setIcon(defaultIcon);
        marker.closePopup(); // Schließt eventuelle Popups
    });
}

// Startet das Quiz oder eine neue Runde
function resetQuiz() {
    score = 0;
    scoreDisplay.textContent = `Punkte: ${score}`;
    
    // Kopiere und mische die Features für die neue Runde
    featuresToAsk = [...allFeaturesData]; 
    shuffleArray(featuresToAsk);

    createMarkers(); // Erstellt die Marker basierend auf allFeaturesData
    
    generateQuestion();
    nextButton.textContent = "Nächste Frage";
    nextButton.disabled = true; 
}

// Event-Listener für den "Nächste Frage"/"Neu starten"-Button
nextButton.addEventListener('click', () => {
    if (featuresToAsk.length === 0 && !currentQuestionData) { // Wenn das Quiz beendet ist
        resetQuiz();
    } else {
        generateQuestion();
    }
});

// Initialisiert die Anwendung, wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', initMap);