// src/components/shared/Map/index.tsx
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapMarker } from './components/MapMarker';
import { DEFAULT_COORDINATES, DEFAULT_ZOOM } from './constants';
import type { MapProps } from './types';

export function Map({
	markers,
	center = DEFAULT_COORDINATES,
	zoom = DEFAULT_ZOOM,
	height = '95vh',
	width = '100%',
	className = '',
	ref,
	onMarkerClick,
}: MapProps) {
	return (
		<MapContainer
			ref={ref}
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
	);
}

export { type MapMarker, type MapProps } from './types';
export { MARKER_COLORS } from './constants';
