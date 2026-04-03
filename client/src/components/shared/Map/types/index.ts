// src/components/shared/Map/types/index.ts
import { Map, type LatLngExpression } from 'leaflet';
import type { MapContainerProps } from 'react-leaflet';

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
  ref?: React.Ref<Map>;
	onMarkerClick?: (marker: MapMarker) => void;
	onMapClick?: () => void;
}
