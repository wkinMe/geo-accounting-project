// src/components/shared/Map/components/MapPopup.tsx
import { FaBuilding, FaWarehouse } from 'react-icons/fa';
import type { MapMarker } from '../../types';

interface MapPopupProps {
	marker: MapMarker;
	onDetailsClick?: () => void;
}

export function MapPopup({ marker, onDetailsClick }: MapPopupProps) {
	const Icon = marker.type === 'warehouse' ? FaWarehouse : FaBuilding;

	return (
		<div className="p-3 min-w-55">
			<div className="flex items-center gap-2 mb-2">
				<Icon className="text-gray-600" />
				<h3 className="font-semibold text-gray-900 dark:text-white">{marker.title}</h3>
			</div>
			{marker.subtitle && (
				<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{marker.subtitle}</p>
			)}
			{marker.description && (
				<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{marker.description}</p>
			)}
			{marker.type === 'warehouse' && onDetailsClick && (
				<button
					onClick={onDetailsClick}
					className="mt-3 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer font-medium"
				>
					Подробнее →
				</button>
			)}
		</div>
	);
}
