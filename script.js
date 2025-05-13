let map;
// geojsonLayer wird nicht mehr für die Hauptinteraktion benötigt, aber wir könnten es für die Anzeige der Umrisse behalten
// let geojsonLayer; 
let score = 0;
let currentQuestionData = null; // Speichert das aktuell gesuchte Bundesland-Objekt
let featuresToAsk = []; // Array der Features, die noch abgefragt werden müssen
let allFeaturesData = []; // Speichert alle geladenen Features für den Neustart
let markersLayer = L.layerGroup(); // Layer-Gruppe für unsere Marker
let targetMarkersLayer = L.layerGroup(); // explizit für Zielmarker
let userClickMarker = null; // Für den Klick des Benutzers
let distanceLine = null; // Für die Distanzlinie
let mapClicksDisabled = true; // Startet deaktiviert, bis Quiz geladen ist

// HTML-Elemente abrufen
const questionDisplay = document.getElementById('question-display');
const questionImage = document.getElementById('question-image');
const questionTextContent = document.getElementById('question-text-content');
const nextButton = document.getElementById('next-btn'); // Button-Variable wiederhergestellt

// Benutzerdefinierte Icons für Marker (optional, aber verbessert das Feedback)
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', // Sicherstellen, dass die shadowUrl hier ist
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Temporär auskommentiert für Testzwecke -> Jetzt wieder aktivieren
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

// Icons
const userPlacedIcon = L.icon({ // Gelb für den Klick des Nutzers
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const correctClickIcon = L.icon({ // Grün für korrekten Klick des Nutzers
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const incorrectClickIcon = L.icon({ // Rot für falschen Klick des Nutzers
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const targetCorrectIcon = L.icon({ // Grün zur Hervorhebung des korrekten Ziels
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', // Oder ein anderes Grün/Blau
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Initialisiert die Karte
function initMap() {
    map = L.map('map').setView([51.1657, 10.4515], 6); // Zentrum Deutschland, Zoom 6
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    markersLayer.addTo(map); // Fügt die Marker-Layer-Gruppe zur Karte hinzu
    targetMarkersLayer.addTo(map); // Layer für Zielmarker
    map.on('click', onMapClickHandler); // Neuer Handler für allgemeine Kartenklicks
    loadAndDisplayData();
}

// Lädt die GeoJSON-Daten und erstellt Marker
async function loadAndDisplayData() {
    try {
        const response = await fetch('geojsonData.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        allFeaturesData = data.features; // Speichert alle Features für den Neustart
        
        createTargetMarkers(); // Zielmarker einmalig erstellen
        resetQuiz();
    } catch (error) {
        console.error("Fehler beim Laden der GeoJSON-Daten:", error);
        questionTextContent.textContent = "Fehler beim Laden der Kartendaten."; 
    }
}

function createTargetMarkers() {
    targetMarkersLayer.clearLayers();
    allFeaturesData.forEach(feature => {
        if (feature.properties && feature.properties.centroid) {
            const marker = L.marker(feature.properties.centroid, { 
                icon: defaultIcon, 
                opacity: 0.0, // Starten unsichtbar oder sehr dezent
                interactive: false // Nicht direkt klickbar machen, Klick auf Karte zählt
            }); 
            marker.featureData = feature.properties; 
            targetMarkersLayer.addLayer(marker);
        }
    });
}

// Handler für Klicks auf die Karte
function onMapClickHandler(e) {
    if (mapClicksDisabled || !currentQuestionData || !currentQuestionData.properties) {
        console.warn("Map click ignored: Clicks disabled or no active question.");
        return;
    }

    mapClicksDisabled = true; // Klicks für diese Antwort deaktivieren
    nextButton.style.display = 'none';
    nextButton.disabled = true;

    if (userClickMarker) map.removeLayer(userClickMarker);
    if (distanceLine) map.removeLayer(distanceLine);

    userClickMarker = L.marker(e.latlng, { icon: userPlacedIcon, zIndexOffset: 1000 }).addTo(map);

    const correctStateName = currentQuestionData.properties.name;
    let correctTargetMarker = null;
    targetMarkersLayer.eachLayer(marker => {
        if (marker.featureData.name === correctStateName) {
            correctTargetMarker = marker;
        }
    });

    if (!correctTargetMarker) {
        console.error("Konnte den Zielmarker für", correctStateName, "nicht finden.");
        mapClicksDisabled = false; // Fehler, Klicks wieder erlauben
        return;
    }

    const distanceInMeters = e.latlng.distanceTo(correctTargetMarker.getLatLng());
    checkAnswer(distanceInMeters, userClickMarker, correctTargetMarker);
}

function checkAnswer(distanceInMeters, clickedUserMarker, actualTargetMarker) {
    const toleranceRadius = 20000; // 20 km
    const distanceInKm = (distanceInMeters / 1000).toFixed(1);
    const correctStateName = actualTargetMarker.featureData.name;

    // Zielmarker sichtbar machen und Standard-Icon zurücksetzen (falls er vorher farbig war)
    actualTargetMarker.setOpacity(1);
    // actualTargetMarker.setIcon(defaultIcon); // Oder ein neutrales "Ziel" Icon

    if (distanceInMeters <= toleranceRadius) {
        score++;
        questionTextContent.textContent = `Richtig! Sehr gut getroffen (${distanceInKm} km). Das ist ${correctStateName}.`;
        clickedUserMarker.setIcon(correctClickIcon);
        actualTargetMarker.setIcon(targetCorrectIcon); // Korrektes Ziel auch hervorheben
    } else {
        questionTextContent.textContent = `Daneben! Du warst ${distanceInKm} km von ${correctStateName} entfernt.`;
        clickedUserMarker.setIcon(incorrectClickIcon);
        actualTargetMarker.setIcon(targetCorrectIcon); // Korrektes Ziel hervorheben

        if (distanceLine) map.removeLayer(distanceLine);
        distanceLine = L.polyline([clickedUserMarker.getLatLng(), actualTargetMarker.getLatLng()], { color: '#e74c3c', weight: 3, dashArray: '5, 5' }).addTo(map);
        
        // Zoom, um Klick und Ziel anzuzeigen
        const bounds = L.latLngBounds(clickedUserMarker.getLatLng(), actualTargetMarker.getLatLng());
        map.fitBounds(bounds.pad(0.2)); // Etwas Padding um die Linie
    }

    setTimeout(() => {
        nextButton.style.display = 'block';
        nextButton.disabled = false;
        if (featuresToAsk.length === 0) {
            questionTextContent.textContent += ` | Quiz beendet! Endpunktzahl: ${score} von ${allFeaturesData.length}.`;
            questionImage.style.display = 'none';
            nextButton.textContent = "Neu starten";
        } else {
            nextButton.textContent = "Nächste Frage";
        }
        currentQuestionData = null; 
    }, 5000);
}

// (De-)Aktiviert Klick-Events auf den Markern (jetzt auf der Karte)
// Diese Funktion ist nicht mehr nötig, da wir mapClicksDisabled verwenden.
/*
function disableMapClicks(disabled) {
    markersLayer.eachLayer(marker => {
        if (disabled) {
            marker.off('click', onMarkerClick);
        } else {
            marker.off('click', onMarkerClick); 
            marker.on('click', onMarkerClick);  
        }
    });
}
*/

// Mischt ein Array (Fisher-Yates Shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Generiert eine neue Frage
function generateQuestion() {
    mapClicksDisabled = false; // Klicks für neue Frage erlauben
    nextButton.style.display = 'none';
    nextButton.disabled = true;

    if (userClickMarker) map.removeLayer(userClickMarker);
    if (distanceLine) map.removeLayer(distanceLine);

    // Zielmarker zurücksetzen (unsichtbar/dezent machen und Standard-Icon)
    targetMarkersLayer.eachLayer(marker => {
        marker.setIcon(defaultIcon);
        marker.setOpacity(0.0); // Wieder unsichtbar/dezent machen
    });

    resetMarkerStyles(); // Diese Funktion könnte jetzt in die obige Logik integriert werden.
    // disableMapClicks(false); // Ersetzt durch mapClicksDisabled

    currentQuestionData = featuresToAsk.pop(); 
    
    if (currentQuestionData && currentQuestionData.properties) {
        questionTextContent.textContent = `Klicke auf die Karte für: ${currentQuestionData.properties.name}`;
        questionImage.style.display = 'block';
        if (currentQuestionData.properties.imageUrl) {
            questionImage.src = currentQuestionData.properties.imageUrl;
            questionImage.alt = `Wappen von ${currentQuestionData.properties.name}`;
        } else {
            questionImage.style.display = 'none'; 
        }
    } else {
        // Sollte durch Button-Logik am Ende des Quiz abgefangen werden
        console.error("Fallback: Keine Fragen mehr oder Fehler.");
        questionTextContent.textContent = "Quiz beendet oder Fehler.";
        questionImage.style.display = 'none';
        nextButton.textContent = "Neu starten";
        nextButton.style.display = 'block';
        nextButton.disabled = false;
        mapClicksDisabled = true; // Keine weiteren Klicks bis Neustart
    }
}

// Setzt die Icons aller Marker auf den Standard zurück (jetzt für targetMarkersLayer)
function resetMarkerStyles() {
    targetMarkersLayer.eachLayer(marker => {
        marker.setIcon(defaultIcon);
        marker.setOpacity(0.0); // Zielmarker standardmäßig unsichtbar/dezent
        marker.closePopup(); 
    });
    if (userClickMarker) { // Auch den User-Klick-Marker entfernen
        map.removeLayer(userClickMarker);
        userClickMarker = null;
    }
    if (distanceLine) { // Auch die Distanzlinie entfernen
        map.removeLayer(distanceLine);
        distanceLine = null;
    }
}

// Startet das Quiz oder eine neue Runde
function resetQuiz() {
    score = 0;
    
    featuresToAsk = [...allFeaturesData]; 
    shuffleArray(featuresToAsk);

    nextButton.style.display = 'none'; // Button initial verstecken/deaktivieren
    nextButton.disabled = true;
    nextButton.textContent = "Nächste Frage"; // Button-Text zurücksetzen

    // createMarkers(); // Umbenannt zu createTargetMarkers und wird nur einmal in loadAndDisplayData aufgerufen
    resetMarkerStyles(); // Stellt sicher, dass alles sauber ist
    generateQuestion();
}

// Event-Listener für den "Nächste Frage"/"Neu starten"-Button
nextButton.addEventListener('click', () => {
    if (featuresToAsk.length === 0 && currentQuestionData === null) { 
        resetQuiz();
    } else if (currentQuestionData === null) { // Antwort wurde angezeigt, Button geklickt
      generateQuestion();
    } else {
      // Sollte nicht passieren, aber als Sicherheitsnetz, falls Button aktiv ist während eine Frage unbeantwortet ist.
      console.warn("Next button clicked while question active. Generating new question.");
      generateQuestion();
    }
});

// Initialisiert die Anwendung, wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', initMap);