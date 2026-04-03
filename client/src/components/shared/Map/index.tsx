// src/components/shared/Map/index.tsx
import { useRef, useImperativeHandle, use } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapMarker } from './components/MapMarker';
import { MapSearch } from './components/MapSearch';
import { useMapSearch } from './hooks/useMapSearch';
import { DEFAULT_COORDINATES, DEFAULT_ZOOM } from './constants';
import type { MapProps } from './types';

export interface MapHandle {
	setView: (center: [number, number], zoom: number) => void;
}

export function Map({
	markers,
	center = DEFAULT_COORDINATES,
	zoom = DEFAULT_ZOOM,
	height = '95vh',
	width = '100%',
	className = '',
	onMarkerClick,
	searchableItems,
	onSearch,
	searchPlaceholder = 'Поиск организаций и складов...',
	enableSearch = false,
	ref,
}: MapProps & { ref?: React.Ref<MapHandle> }) {
	const mapRef = useRef<any>(null);
	const { searchQuery, setSearchQuery, searchResults, isSearching, clearSearch } = useMapSearch({
		items: searchableItems,
		onSearch,
	});

	useImperativeHandle(ref, () => ({
		setView: (center, zoomLevel) => {
			if (mapRef.current) {
				mapRef.current.setView(center, zoomLevel);
			}
		},
	}));

	const handleSelectResult = (result: any) => {
		if (mapRef.current) {
			mapRef.current.setView([result.latitude, result.longitude], 18);
		}
		clearSearch();
	};
	Map;
	return (
		<div className="relative flex flex-col h-full">
			{/* Поиск над картой */}
			{enableSearch && (
					<MapSearch
						searchQuery={searchQuery}
						onSearchQueryChange={setSearchQuery}
						searchResults={searchResults}
						isSearching={isSearching}
						onSelectResult={handleSelectResult}
						placeholder={searchPlaceholder}
					/>
			)}

			{/* Карта */}
			<div className={enableSearch ? 'flex-1 min-h-0' : 'h-full'}>
				<MapContainer
					ref={mapRef}
					center={center}
					zoom={zoom}
					style={{ height, width }}
					className={`rounded-lg shadow-md ${className}`}
				>
					<TileLayer
						url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
						subdomains="abcd"
						maxZoom={19}
					/>
					{markers.map((marker) => (
						<MapMarker
							key={`${marker.type}-${marker.id}`}
							marker={marker}
							onMarkerClick={onMarkerClick}
						/>
					))}
				</MapContainer>
			</div>
		</div>
	);
}

export { type MapMarker, type MapProps, type SearchableItem } from './types';
export { MARKER_COLORS } from './constants';
