export class UIManager {
    constructor() {
        this.questionDisplay = document.getElementById('question-display');
        this.questionTextContent = document.getElementById('question-text-content');
        this.nextButton = document.getElementById('next-btn');
        this.infoDisplayDiv = document.getElementById('info-display');
        this.infoCountry = document.getElementById('info-country');
        this.infoFaculties = document.getElementById('info-faculties');
        this.infoWebsite = document.getElementById('info-website');
    }

    showQuestion(questionData) {
        this.questionTextContent.textContent = `Wo liegt die Partneruniversität: ${questionData.properties.name}?`;
        // Bild anzeigen, wenn vorhanden
        const questionImage = document.getElementById('question-image');
        if (questionData.properties.imageUrl) {
            questionImage.src = questionData.properties.imageUrl;
            questionImage.alt = `Bild von ${questionData.properties.name}`;
            questionImage.style.display = 'block';
        } else {
            questionImage.style.display = 'none';
        }
        this.infoDisplayDiv.style.display = 'none';
        this.nextButton.style.display = 'none';
    }

    showAnswerFeedback(isCorrect, distance, questionData, userMarker, correctLatLng) {
        const distanceInKm = (distance / 1000).toFixed(1);
        // Bild anzeigen, wenn vorhanden
        const questionImage = document.getElementById('question-image');
        if (questionData.properties.imageUrl) {
            questionImage.src = questionData.properties.imageUrl;
            questionImage.alt = `Bild von ${questionData.properties.name}`;
            questionImage.style.display = 'block';
        } else {
            questionImage.style.display = 'none';
        }
        if (isCorrect) {
            this.questionTextContent.textContent = `Richtig! Sehr gut getroffen (${distanceInKm} km). Das ist ${questionData.properties.name}.`;
        } else {
            this.questionTextContent.textContent = `Du warst ${distanceInKm} km von ${questionData.properties.name} entfernt.`;
            // Distanzlinie auf der Karte anzeigen
            if (window.mapManager && userMarker && correctLatLng) {
                window.mapManager.addDistanceLine(userMarker.getLatLng(), correctLatLng);
                window.mapManager.fitBoundsToMarkers(userMarker.getLatLng(), correctLatLng);
            }
        }
        // Info anzeigen
        this.infoCountry.textContent = questionData.properties.country || 'N/A';
        this.infoFaculties.textContent = Array.isArray(questionData.properties.faculties)
            ? questionData.properties.faculties.join(', ')
            : 'N/A';
        if (questionData.properties.website) {
            this.infoWebsite.href = questionData.properties.website;
            this.infoWebsite.textContent = 'Besuchen';
            this.infoWebsite.style.display = 'inline';
        } else {
            this.infoWebsite.style.display = 'none';
        }
        this.infoDisplayDiv.style.display = 'block';
        this.nextButton.style.display = 'block';
    }

    showQuizEnd(score, total) {
        this.questionTextContent.textContent = `Quiz beendet! Dein Score: ${score} von ${total}`;
        this.infoDisplayDiv.style.display = 'none';
        this.nextButton.style.display = 'block';
        this.nextButton.textContent = 'Neu starten';
    }
} 