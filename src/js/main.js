import { MapManager } from './core/MapManager.js';
import { QuizManager } from './core/QuizManager.js';
import { UIManager } from './core/UIManager.js';
import { MAP_CONFIG, targetCorrectIcon } from './config/constants.js';

document.addEventListener('DOMContentLoaded', () => {
    const mapManager = new MapManager('map');
    window.mapManager = mapManager;
    window.targetCorrectIcon = targetCorrectIcon;
    const uiManager = new UIManager();
    const quizManager = new QuizManager(mapManager, uiManager);

    mapManager.initMap(MAP_CONFIG.CENTER, MAP_CONFIG.ZOOM, (e) => {
        quizManager.handleMapClick(e.latlng);
    });

    uiManager.nextButton.addEventListener('click', () => {
        if (uiManager.nextButton.textContent === 'Neu starten') {
            quizManager.startQuiz();
            uiManager.nextButton.textContent = 'Nächste Frage';
        } else {
            quizManager.nextQuestion();
        }
    });

    quizManager.startQuiz();
}); 