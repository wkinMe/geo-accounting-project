// client/src/components/pages/Map.tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { renderToString } from 'react-dom/server';
import { useQuery } from '@tanstack/react-query';
import { warehouseService } from '@/services/warehouseService';
import { organizationService } from '@/services/organizationService';
import { userService } from '@/services/userService';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router';
import { useProfile } from '@/hooks';
import { atLeastManager } from '@/utils';

const GOMEL_COORDINATES: [number, number] = [52.4345, 30.95];

// Цвета для разных типов маркеров
const MARKER_COLORS = {
	OWN_ORG: '#800020', // Бордовый
	OTHER_ORG: '#FF0000', // Красный
	OWN_WITH_MANAGER: '#00008B', // Тёмно-синий
	OWN_NO_MANAGER: '#006400', // Тёмно-зелёный
	OTHER_WITH_MANAGER: '#1E90FF', // Синий
	OTHER_NO_MANAGER: '#32CD32', // Зелёный
};

const createCustomIcon = (color: string) => {
	const svgHtml = renderToString(
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
			<path
				d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 16 8 16s8-10.6 8-16c0-4.4-3.6-8-8-8z"
				fill={color}
				stroke="#333"
				strokeWidth="1"
			/>
			<circle cx="12" cy="8" r="3" fill="white" />
		</svg>
	);

	return divIcon({
		html: svgHtml,
		iconSize: [24, 32],
		iconAnchor: [12, 32],
		popupAnchor: [0, -32],
		className: 'custom-marker',
	});
};

export function Map() {
	const navigate = useNavigate();

	const profileQuery = useProfile();
	const profile = profileQuery.data?.data;

	const { data: warehousesData, isLoading: isLoadingWarehouses } = useQuery({
		queryKey: ['warehouses'],
		queryFn: () =>
			atLeastManager(profile?.role)
				? warehouseService.findAll()
				: warehouseService.findByOrganizationId(profile?.organization_id || 0),
	});

	const { data: organizationsData, isLoading: isLoadingOrganizations } = useQuery({
		queryKey: ['organizations'],
		queryFn: async () => {
			if (atLeastManager(profile?.role)) {
				return organizationService.findAll();
			} else {
				const singleOrg = await organizationService.findById(profile?.organization_id || 0);
				return { ...singleOrg, data: [singleOrg.data] };
			}
		},
	});

	const isLoading = isLoadingWarehouses || isLoadingOrganizations;
	const currentUserOrgId = profile?.organization_id;

	const warehouses = warehousesData?.data?.filter((w) => w.latitude && w.longitude) || [];
	const organizations = organizationsData?.data?.filter((o) => o.latitude && o.longitude) || [];

	const getOrganizationColor = (orgId: number) => {
		return orgId === currentUserOrgId ? MARKER_COLORS.OWN_ORG : MARKER_COLORS.OTHER_ORG;
	};

	const getWarehouseColor = (warehouse: any) => {
		const isOwnOrg = warehouse.organization_id === currentUserOrgId;
		const hasManager = warehouse.manager_id !== null;

		if (isOwnOrg) {
			return hasManager ? MARKER_COLORS.OWN_WITH_MANAGER : MARKER_COLORS.OWN_NO_MANAGER;
		} else {
			return hasManager ? MARKER_COLORS.OTHER_WITH_MANAGER : MARKER_COLORS.OTHER_NO_MANAGER;
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[95vh]">
				<div className="text-center">Загрузка карты...</div>
			</div>
		);
	}

	return (
		<MapContainer
			center={GOMEL_COORDINATES}
			zoom={12}
			style={{ height: '95vh', width: '100%' }}
			className="rounded-lg shadow-md"
		>
			<TileLayer
				url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
				attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
				maxZoom={20}
			/>

			{/* Организации */}
			{organizations.map((org) => (
				<Marker
					key={`org-${org.id}`}
					position={[org.latitude!, org.longitude!]}
					icon={createCustomIcon(getOrganizationColor(org.id))}
				>
					<Popup>
						<div className="p-2 min-w-[200px]">
							<h3 className="font-semibold text-gray-900 dark:text-white">{org.name}</h3>
							<p className="text-xs text-gray-500 mt-2">🏢 Головной офис</p>
						</div>
					</Popup>
				</Marker>
			))}

			{/* Склады */}
			{warehouses.map((warehouse) => (
				<Marker
					key={`wh-${warehouse.id}`}
					position={[warehouse.latitude!, warehouse.longitude!]}
					icon={createCustomIcon(getWarehouseColor(warehouse))}
				>
					<Popup>
						<div className="p-2 min-w-[220px]">
							<h3 className="font-semibold text-gray-900 dark:text-white">{warehouse.name}</h3>
							{warehouse.organization && (
								<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
									🏭 {warehouse.organization.name}
								</p>
							)}
							<p className="text-sm text-gray-600 dark:text-gray-400">
								👨‍💼 Менеджер: {warehouse.manager?.name || 'Не назначен'}
							</p>
							<button
								onClick={() => navigate(`/warehouses/${warehouse.id}`)}
								className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer"
							>
								Подробнее →
							</button>
						</div>
					</Popup>
				</Marker>
			))}
		</MapContainer>
	);
}
