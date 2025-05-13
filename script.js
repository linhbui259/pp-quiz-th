let map;
let geojsonLayer;
let score = 0;
let currentQuestionData = null; // Speichert das aktuell gesuchte Bundesland-Objekt
let featuresToAsk = []; // Array der Features, die noch abgefragt werden müssen
let allFeaturesData = []; // Speichert alle geladenen Features für den Neustart

// Standard-Stil für GeoJSON-Layer
const defaultStyle = {
    fillColor: "#3498db",
    color: "#2c3e50",
    weight: 1,
    fillOpacity: 0.5
};

const correctStyle = {
    fillColor: "#2ecc71",
    fillOpacity: 0.7,
    weight: 2,
    color: "#27ae60"
};

const incorrectStyle = {
    fillColor: "#e74c3c",
    fillOpacity: 0.7,
    weight: 2,
    color: "#c0392b"
};

// HTML-Elemente abrufen
const questionDisplay = document.getElementById('question-display');
const scoreDisplay = document.getElementById('score');
const nextButton = document.getElementById('next-btn');

// Initialisiert die Karte
function initMap() {
    map = L.map('map').setView([51.1657, 10.4515], 6); // Zentrum Deutschland, Zoom 6
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    console.log("Map initialized");
}

// Lädt GeoJSON-Daten und fügt sie zur Karte hinzu
async function loadGeoDataAndStartQuiz() {
    try {
        const response = await fetch('geojsonData.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        allFeaturesData = JSON.parse(JSON.stringify(data.features)); // Tiefenkopie für Neustart
        
        resetQuiz(); // Startet das Quiz mit den geladenen Daten

    } catch (error) {
        console.error("Fehler beim Laden der GeoJSON-Daten:", error);
        questionDisplay.textContent = "Fehler beim Laden der Kartendaten.";
    }
}

function setupGeoJsonLayer() {
    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
    }
    geojsonLayer = L.geoJSON({
        type: "FeatureCollection",
        features: allFeaturesData
    }, {
        style: defaultStyle,
        onEachFeature: onEachFeature
    }).addTo(map);
}

function resetQuiz() {
    score = 0;
    scoreDisplay.textContent = `Punkte: ${score}`;
    featuresToAsk = shuffleArray([...allFeaturesData]); // Neue gemischte Liste für die Runde
    
    setupGeoJsonLayer();
    generateQuestion();
    nextButton.textContent = "Nächste Frage";
}

// Wird für jedes Feature (Bundesland) aufgerufen
function onEachFeature(feature, layer) {
    layer.on({
        click: onFeatureClick
    });
}

// Behandelt Klicks auf ein Feature
function onFeatureClick(e) {
    if (!currentQuestionData || nextButton.disabled === false) return; // Nur reagieren, wenn eine Frage aktiv ist und noch nicht beantwortet wurde

    const clickedLayer = e.target;
    const clickedFeatureName = clickedLayer.feature.properties.name;
    checkAnswer(clickedFeatureName, clickedLayer);
}

// Mischt ein Array (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Generiert eine neue Frage
function generateQuestion() {
    geojsonLayer.eachLayer(layer => layer.setStyle(defaultStyle).bringToFront()); // Reset style and ensure clickability
    enableMapClicks(true);

    if (featuresToAsk.length === 0) {
        questionDisplay.textContent = `Quiz beendet! Endpunktzahl: ${score}`;
        nextButton.textContent = "Neu starten";
        nextButton.disabled = false;
        currentQuestionData = null;
        return;
    }

    currentQuestionData = featuresToAsk.pop();
    questionDisplay.textContent = `Klicke auf: ${currentQuestionData.properties.name}`;
    nextButton.disabled = true;
}

// Überprüft die Antwort
function checkAnswer(clickedName, clickedLayer) {
    if (!currentQuestionData) return;

    const correctName = currentQuestionData.properties.name;
    enableMapClicks(false); // Klicks deaktivieren nach Antwort

    if (clickedName === correctName) {
        score++;
        scoreDisplay.textContent = `Punkte: ${score}`;
        clickedLayer.setStyle(correctStyle).bringToFront();
        questionDisplay.textContent = `Richtig! Das ist ${correctName}.`;
    } else {
        clickedLayer.setStyle(incorrectStyle).bringToFront();
        geojsonLayer.eachLayer(layer => {
            if (layer.feature.properties.name === correctName) {
                layer.setStyle(correctStyle).bringToFront();
            }
        });
        questionDisplay.textContent = `Falsch. Das war ${clickedName}. Gesucht war ${correctName}.`;
    }
    currentQuestionData = null; // Frage als beantwortet markieren
    nextButton.disabled = false;
}

function enableMapClicks(enable) {
    if (geojsonLayer) {
        geojsonLayer.eachLayer(layer => {
            if (enable) {
                layer.on('click', onFeatureClick);
            } else {
                layer.off('click', onFeatureClick);
            }
        });
    }
}

// Event-Listener für den "Nächste Frage" / "Neu starten"-Button
nextButton.addEventListener('click', () => {
    if (featuresToAsk.length === 0 && !currentQuestionData) { // Quiz war beendet
        resetQuiz();
    } else {
        generateQuestion();
    }
});

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadGeoDataAndStartQuiz();
});