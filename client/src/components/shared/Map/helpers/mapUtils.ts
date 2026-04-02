// src/components/shared/Map/helpers/mapUtils.ts
import { type LatLngExpression } from 'leaflet';

export const isValidPosition = (lat: number | null, lng: number | null): boolean => {
	return lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);
};

export const getBoundsFromMarkers = (markers: Array<{ position: LatLngExpression }>) => {
	// Можно реализовать автоматическое центрирование по всем маркерам
	return null;
};
