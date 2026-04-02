// src/components/shared/Map/types/index.ts
import { type LatLngExpression } from 'leaflet';

export type MarkerType = 'warehouse' | 'organization';

export interface MapMarker {
	id: number | string;
	type: MarkerType;
	position: LatLngExpression;
	iconColor: string;
	title: string;
	subtitle?: string;
	description?: string;
	data?: any;
	onClick?: () => void;
}

export interface MapProps {
	markers: MapMarker[];
	center?: LatLngExpression;
	zoom?: number;
	height?: string | number;
	width?: string | number;
	className?: string;
	onMarkerClick?: (marker: MapMarker) => void;
	onMapClick?: () => void;
}
