// src/components/shared/Map/components/MapPopup.tsx
import { FaBuilding, FaWarehouse } from 'react-icons/fa';
import type { MapMarker } from '../../types';

interface MapPopupProps {
	marker: MapMarker;
	onDetailsClick?: () => void;
	onCreateAgreement?: () => void; // 🆕 новый пропс
}

export function MapPopup({ marker, onDetailsClick, onCreateAgreement }: MapPopupProps) {
	const Icon = marker.type === 'warehouse' ? FaWarehouse : FaBuilding;

	const handleDetailsClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		e.nativeEvent.stopImmediatePropagation();
		if (onDetailsClick) {
			onDetailsClick();
		}
		return false;
	};

	const handleCreateAgreement = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		e.nativeEvent.stopImmediatePropagation();
		if (onCreateAgreement) {
			onCreateAgreement();
		}
		return false;
	};

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

			<div className="flex gap-2 mt-3">
				{marker.type === 'warehouse' && onDetailsClick && (
					<button
						onMouseDown={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}
						onClick={handleDetailsClick}
						className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer font-medium"
					>
						Подробнее →
					</button>
				)}

				{marker.type === 'warehouse' && onCreateAgreement && (
					<button
						onMouseDown={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}
						onClick={handleCreateAgreement}
						className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 cursor-pointer font-medium"
					>
						Составить договор →
					</button>
				)}
			</div>
		</div>
	);
}
