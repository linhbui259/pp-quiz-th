import { MAP_CONFIG } from '../config/constants.js';
import { shuffleArray } from '../utils/helpers.js';
import { calculateDistance } from '../utils/distance.js';

export class QuizManager {
    constructor(mapManager, uiManager) {
        this.mapManager = mapManager;
        this.uiManager = uiManager;
        this.score = 0;
        this.currentQuestionData = null;
        this.featuresToAsk = [];
        this.allFeaturesData = [];
    }

    async loadData() {
        const response = await fetch('geojsonData.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        this.allFeaturesData = data.features;
        this.featuresToAsk = shuffleArray([...this.allFeaturesData]);
        this.mapManager.createTargetMarkers(this.allFeaturesData);
    }

    async startQuiz() {
        this.score = 0;
        await this.loadData();
        this.nextQuestion();
    }

    nextQuestion() {
        if (this.featuresToAsk.length === 0) {
            this.uiManager.showQuizEnd(this.score, this.allFeaturesData.length);
            return;
        }
        this.currentQuestionData = this.featuresToAsk.pop();
        this.uiManager.showQuestion(this.currentQuestionData);
        this.mapManager.mapClicksDisabled = false;
    }

    handleMapClick(latlng) {
        if (this.mapManager.mapClicksDisabled || !this.currentQuestionData) return;
        this.mapManager.mapClicksDisabled = true;
        this.mapManager.clearUserMarkerAndLine();
        const correctLatLng = L.latLng(this.currentQuestionData.properties.centroid);
        const distance = calculateDistance(latlng, correctLatLng);
        const isCorrect = distance <= MAP_CONFIG.TOLERANCE_RADIUS;
        this.mapManager.targetMarkersLayer.eachLayer(marker => {
            if (marker.getLatLng().lat === correctLatLng.lat && marker.getLatLng().lng === correctLatLng.lng) {
                marker.setIcon(window.targetCorrectIcon || window.L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
                }));
                marker.setOpacity(1);
            }
        });
        const userMarker = this.mapManager.addUserClickMarker(latlng, isCorrect ? window.correctClickIcon : window.incorrectClickIcon);
        if (!isCorrect) {
            this.mapManager.addDistanceLine(userMarker.getLatLng(), correctLatLng);
            this.mapManager.fitBoundsToMarkers(userMarker.getLatLng(), correctLatLng);
        }
        this.uiManager.showAnswerFeedback(isCorrect, distance, this.currentQuestionData, userMarker, correctLatLng);
    }
} 