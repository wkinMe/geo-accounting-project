// src/components/shared/Map/components/MapMarker.tsx
import { Marker, Popup, Tooltip } from 'react-leaflet';
import type { MapMarker as MapMarkerType } from '../../types';
import { createCustomIcon } from '../../helpers/createCustomIcon';
import { MapPopup } from '../MapPopup';

interface MapMarkerProps {
	marker: MapMarkerType;
	onMarkerClick?: (marker: MapMarkerType) => void;
}

export function MapMarker({ marker, onMarkerClick }: MapMarkerProps) {
	const handleClick = () => {
		if (marker.onClick) {
			marker.onClick();
		}
		onMarkerClick?.(marker);
	};

	const handleDetailsClick = () => {
		if (marker.onDetailsClick) {
			marker.onDetailsClick();
		}
	};

	const handleCreateAgreement = () => {
		if (marker.onCreateAgreement) {
			marker.onCreateAgreement();
		}
	};

	return (
		<Marker
			position={marker.position}
			icon={createCustomIcon(marker.iconColor, marker.type)}
			eventHandlers={{ click: handleClick }}
		>
			<Tooltip
				sticky
				direction="top"
				offset={[0, -20]}
				className="bg-white! shadow-lg! rounded-lg! border! border-gray-200! p-2! text-sm!"
			>
				<div className="flex items-center gap-2">
					<span className="font-semibold text-gray-900">{marker.title}</span>
				</div>
				{marker.subtitle && <div className="text-xs text-gray-500 mt-0.5">{marker.subtitle}</div>}
			</Tooltip>
			<Popup>
				<MapPopup
					marker={marker}
					onDetailsClick={marker.onDetailsClick && handleDetailsClick}
					onCreateAgreement={marker.onCreateAgreement && handleCreateAgreement}
				/>
			</Popup>
		</Marker>
	);
}
