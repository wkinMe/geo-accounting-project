// src/components/shared/Map/types/index.ts
import { type LatLngExpression, type Map as LeafletMap } from 'leaflet';

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
	onDetailsClick?: () => void;
	onCreateAgreement?: () => void;
}

export interface SearchableItem {
	id: number | string;
	type: MarkerType;
	name: string;
	subtitle: string;
	latitude: number;
	longitude: number;
}

export interface MapProps {
	markers: MapMarker[];
	center?: LatLngExpression;
	zoom?: number;
	height?: string | number;
	width?: string | number;
	className?: string;
	ref?: React.Ref<LeafletMap>;
	onMarkerClick?: (marker: MapMarker) => void;

	searchableItems?: SearchableItem[];
	onSearch?: (query: string) => Promise<SearchableItem[]> | SearchableItem[];
	searchPlaceholder?: string;
	enableSearch?: boolean;
}
