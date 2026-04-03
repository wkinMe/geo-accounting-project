// src/components/shared/LocationPicker/index.tsx
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { renderToString } from 'react-dom/server';
import { FaWarehouse, FaBuilding, FaMapMarkerAlt } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';

// Создание кастомной иконки для разных типов объектов
const createCustomIcon = (type: 'warehouse' | 'organization' | 'default', color?: string) => {
	let IconComponent;
	let defaultColor;
	let iconSize = 32;

	switch (type) {
		case 'warehouse':
			IconComponent = FaWarehouse;
			defaultColor = color || '#2E7D32';
			break;
		case 'organization':
			IconComponent = FaBuilding;
			defaultColor = color || '#8B4513';
			break;
		default:
			IconComponent = FaMapMarkerAlt;
			defaultColor = color || '#2E7D32';
			iconSize = 28;
	}

	const finalColor = color || defaultColor;

	const svgHtml = renderToString(
		<div
			style={{
				position: 'relative',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<div
				style={{
					backgroundColor: finalColor,
					borderRadius: '50%',
					width: `${iconSize}px`,
					height: `${iconSize}px`,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
					border: '2px solid white',
				}}
			>
				<IconComponent style={{ color: 'white', fontSize: `${iconSize - 14}px` }} />
			</div>
			<div
				style={{
					position: 'absolute',
					bottom: '-8px',
					left: '50%',
					transform: 'translateX(-50%)',
					width: 0,
					height: 0,
					borderLeft: '6px solid transparent',
					borderRight: '6px solid transparent',
					borderTop: `8px solid ${finalColor}`,
				}}
			/>
		</div>
	);

	return divIcon({
		html: svgHtml,
		iconSize: [iconSize, iconSize + 8],
		iconAnchor: [iconSize / 2, iconSize + 8],
		popupAnchor: [0, -(iconSize + 8)],
		className: 'custom-marker',
	});
};

// Компонент для обновления вида карты
function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
	const map = useMap();
	useEffect(() => {
		map.setView(center, zoom);
	}, [center, zoom, map]);
	return null;
}

interface LocationPickerProps {
	latitude?: number | null;
	longitude?: number | null;
	onLocationChange: (lat: number, lng: number) => void;
	height?: string;
	width?: string;
	readOnly?: boolean;
	markerType?: 'warehouse' | 'organization' | 'default';
	markerColor?: string;
}

function LocationMarker({
	position,
	onLocationSelect,
	readOnly,
	markerType = 'default',
	markerColor,
}: {
	position: [number, number] | null;
	onLocationSelect: (lat: number, lng: number) => void;
	readOnly: boolean;
	markerType?: 'warehouse' | 'organization' | 'default';
	markerColor?: string;
}) {
	useMapEvents({
		click(e) {
			if (!readOnly) {
				const { lat, lng } = e.latlng;
				onLocationSelect(lat, lng);
			}
		},
	});

	return position ? (
		<Marker position={position} icon={createCustomIcon(markerType, markerColor)} />
	) : null;
}

export function LocationPicker({
	latitude,
	longitude,
	onLocationChange,
	height = '400px',
	width = '100%',
	readOnly = false,
	markerType = 'default',
	markerColor,
}: LocationPickerProps) {
	const [position, setPosition] = useState<[number, number] | null>(null);
	const defaultCenter: [number, number] = [52.4345, 30.95]; // Гомель

	useEffect(() => {
		if (latitude && longitude) {
			setPosition([latitude, longitude]);
		} else if (!readOnly && !position) {
			setPosition(defaultCenter);
		}
	}, [latitude, longitude, readOnly]);

	const handleLocationSelect = (lat: number, lng: number) => {
		setPosition([lat, lng]);
		onLocationChange(lat, lng);
	};

	// Центр карты: если есть позиция - на неё, иначе на дефолтный центр
	const center = position || defaultCenter;

	return (
		<div className="space-y-2">
			<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
				Местоположение {!readOnly && <span className="text-red-500">*</span>}
				{!readOnly && (
					<span className="ml-2 text-xs text-gray-500 font-normal">
						(кликните по карте, чтобы выбрать место)
					</span>
				)}
			</label>
			<div
				style={{ height, width }}
				className={`rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
			>
				<MapContainer
					center={center}
					zoom={13}
					style={{ height: '100%', width: '100%' }}
					className="z-0"
				>
					<ChangeMapView center={center} zoom={13} />
					<TileLayer
						url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
						subdomains="abcd"
						maxZoom={19}
					/>
					<LocationMarker
						position={position}
						onLocationSelect={handleLocationSelect}
						readOnly={readOnly}
						markerType={markerType}
						markerColor={markerColor}
					/>
				</MapContainer>
			</div>
			{position && !readOnly && (
				<p className="text-xs text-green-600 dark:text-green-400">
					✓ Координаты: {position[0].toFixed(6)}, {position[1].toFixed(6)}
				</p>
			)}
		</div>
	);
}
