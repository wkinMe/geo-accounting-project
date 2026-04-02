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
import { FaWarehouse, FaBuilding } from 'react-icons/fa';

const GOMEL_COORDINATES: [number, number] = [52.4345, 30.95];

// Цвета для разных типов маркеров
const MARKER_COLORS = {
	OWN_ORG: '#8B4513', // Коричневый (свой завод)
	OTHER_ORG: '#CD853F', // Светло-коричневый (чужой завод)
	OWN_WITH_MANAGER: '#2E7D32', // Зелёный (свой склад с менеджером)
	OWN_NO_MANAGER: '#66BB6A', // Светло-зелёный (свой склад без менеджера)
	OTHER_WITH_MANAGER: '#1565C0', // Синий (чужой склад с менеджером)
	OTHER_NO_MANAGER: '#42A5F5', // Голубой (чужой склад без менеджера)
};

const createCustomIcon = (color: string, type: 'warehouse' | 'organization') => {
	const IconComponent = type === 'warehouse' ? FaWarehouse : FaBuilding;

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
					backgroundColor: color,
					borderRadius: '50%',
					width: '32px',
					height: '32px',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
					border: '2px solid white',
				}}
			>
				<IconComponent style={{ color: 'white', fontSize: '18px' }} />
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
					borderTop: `8px solid ${color}`,
				}}
			/>
		</div>
	);

	return divIcon({
		html: svgHtml,
		iconSize: [32, 40],
		iconAnchor: [16, 40],
		popupAnchor: [0, -40],
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
				<div className="text-center text-gray-500">Загрузка карты...</div>
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
					icon={createCustomIcon(getOrganizationColor(org.id), 'organization')}
				>
					<Popup>
						<div className="p-3 min-w-[220px]">
							<div className="flex items-center gap-2 mb-2">
								<FaBuilding className="text-gray-600" />
								<h3 className="font-semibold text-gray-900 dark:text-white">{org.name}</h3>
							</div>
							<p className="text-xs text-gray-500">🏢 Головной офис</p>
							<p className="text-xs text-gray-500 mt-1">
								📍 {org.latitude?.toFixed(4)}, {org.longitude?.toFixed(4)}
							</p>
						</div>
					</Popup>
				</Marker>
			))}

			{/* Склады */}
			{warehouses.map((warehouse) => (
				<Marker
					key={`wh-${warehouse.id}`}
					position={[warehouse.latitude!, warehouse.longitude!]}
					icon={createCustomIcon(getWarehouseColor(warehouse), 'warehouse')}
				>
					<Popup>
						<div className="p-3 min-w-[250px]">
							<div className="flex items-center gap-2 mb-2">
								<FaWarehouse className="text-gray-600" />
								<h3 className="font-semibold text-gray-900 dark:text-white">{warehouse.name}</h3>
							</div>
							{warehouse.organization && (
								<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
									🏭 {warehouse.organization.name}
								</p>
							)}
							<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
								👨‍💼 Менеджер: {warehouse.manager?.name || 'Не назначен'}
							</p>
							<button
								onClick={() => navigate(`/warehouses/${warehouse.id}`)}
								className="mt-3 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer font-medium"
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
