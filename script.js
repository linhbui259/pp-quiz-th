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
        questionTextContent.textContent = "Fehler beim Laden der Kartendaten."; 
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
    if (!currentQuestionData || !currentQuestionData.properties) { 
        console.warn("onMarkerClick aufgerufen, aber currentQuestionData ist nicht korrekt gesetzt oder nächste Frage wird bereits geladen.");
        return; 
    }

    const clickedMarker = e.target;
    const clickedFeatureName = clickedMarker.featureData.name;

    disableMapClicks(true); 
    
    const correctFeatureName = currentQuestionData.properties.name; 

    if (clickedFeatureName === correctFeatureName) {
        score++;
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
    
    setTimeout(proceedToNextQuestion, 1500);
}

// Geht zur nächsten Frage oder beendet das Quiz
function proceedToNextQuestion() {
    currentQuestionData = null;
    if (featuresToAsk.length === 0) {
        questionTextContent.textContent = `Quiz beendet! Endpunktzahl: ${score} von ${allFeaturesData.length}. Zum Neustarten Seite neu laden.`;
        questionImage.style.display = 'none';
    } else {
        generateQuestion();
    }
}

// (De-)Aktiviert Klick-Events auf den Markern
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

// Mischt ein Array (Fisher-Yates Shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Generiert eine neue Frage
function generateQuestion() {
    resetMarkerStyles(); 
    disableMapClicks(false); 

    currentQuestionData = featuresToAsk.pop(); 
    
    if (currentQuestionData && currentQuestionData.properties) {
        questionTextContent.textContent = `Klicke auf: ${currentQuestionData.properties.name}`;
        if (currentQuestionData.properties.imageUrl) {
            questionImage.src = currentQuestionData.properties.imageUrl;
            questionImage.alt = `Wappen von ${currentQuestionData.properties.name}`;
            questionImage.style.display = 'block';
        } else {
            questionImage.style.display = 'none'; 
        }
    } else {
        console.error("Fehler: Ungültige Fragendaten oder fehlende Properties", currentQuestionData);
        questionTextContent.textContent = "Fehler beim Laden der Frage.";
        questionImage.style.display = 'none';
        currentQuestionData = null; 
    }
}

// Setzt die Icons aller Marker auf den Standard zurück
function resetMarkerStyles() {
    markersLayer.eachLayer(marker => {
        marker.setIcon(defaultIcon);
        marker.closePopup(); 
    });
}

// Startet das Quiz oder eine neue Runde
function resetQuiz() {
    score = 0;
    
    featuresToAsk = [...allFeaturesData]; 
    shuffleArray(featuresToAsk);

    createMarkers(); 
    
    generateQuestion();
}

// Initialisiert die Anwendung, wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', initMap);