import { defaultIcon, userPlacedIcon, correctClickIcon, incorrectClickIcon, targetCorrectIcon } from '../config/constants.js';

export class MapManager {
    constructor(mapContainerId) {
        this.map = null;
        this.markersLayer = L.layerGroup();
        this.targetMarkersLayer = L.layerGroup();
        this.userClickMarker = null;
        this.distanceLine = null;
        this.mapClicksDisabled = true;
        this.mapContainerId = mapContainerId;
    }

    initMap(center, zoom, onMapClickHandler) {
        this.map = L.map(this.mapContainerId).setView(center, zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
        this.markersLayer.addTo(this.map);
        this.targetMarkersLayer.addTo(this.map);
        this.map.on('click', onMapClickHandler);
    }

    clearUserMarkerAndLine() {
        if (this.userClickMarker) this.map.removeLayer(this.userClickMarker);
        if (this.distanceLine) this.map.removeLayer(this.distanceLine);
    }

    addUserClickMarker(latlng, icon = userPlacedIcon) {
        this.userClickMarker = L.marker(latlng, { icon: icon, zIndexOffset: 1000 }).addTo(this.map);
        return this.userClickMarker;
    }

    addDistanceLine(fromLatLng, toLatLng) {
        this.distanceLine = L.polyline([fromLatLng, toLatLng], { color: '#e74c3c', weight: 3, dashArray: '5, 5' }).addTo(this.map);
        return this.distanceLine;
    }

    fitBoundsToMarkers(latlng1, latlng2) {
        const bounds = L.latLngBounds(latlng1, latlng2);
        this.map.fitBounds(bounds.pad(0.2));
    }

    createTargetMarkers(features) {
        this.targetMarkersLayer.clearLayers();
        features.forEach(feature => {
            if (feature.properties && feature.properties.centroid) {
                const marker = L.marker(feature.properties.centroid, {
                    icon: defaultIcon,
                    opacity: 0.0,
                    interactive: false
                });
                marker.featureData = feature.properties;
                this.targetMarkersLayer.addLayer(marker);
            }
        });
    }
} 