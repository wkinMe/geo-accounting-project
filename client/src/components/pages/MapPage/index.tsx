// src/components/pages/MapPage.tsx
import { useQuery } from '@tanstack/react-query';
import { Map, MARKER_COLORS, type MapMarker } from '@/components/shared/Map';
import { warehouseService } from '@/services/warehouseService';
import { organizationService } from '@/services/organizationService';
import { useProfile } from '@/hooks';
import { atLeastManager } from '@/utils';
import { useNavigate } from 'react-router';

export function MapPage() {
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

	// Преобразуем организации в маркеры
	const organizationsMarkers: MapMarker[] =
		organizationsData?.data
			?.filter((o) => o.latitude && o.longitude)
			.map((org) => ({
				id: org.id,
				type: 'organization',
				position: [org.latitude!, org.longitude!],
				iconColor: getOrganizationColor(org.id),
				title: org.name,
				subtitle: 'Головной офис',
			})) || [];

	// Преобразуем склады в маркеры
	const warehousesMarkers: MapMarker[] =
		warehousesData?.data
			?.filter((w) => w.latitude && w.longitude)
			.map((warehouse) => ({
				id: warehouse.id,
				type: 'warehouse',
				position: [warehouse.latitude!, warehouse.longitude!],
				iconColor: getWarehouseColor(warehouse),
				title: warehouse.name,
				subtitle: warehouse.organization?.name,
				description: `Менеджер: ${warehouse.manager?.name || 'Не назначен'}`,
			})) || [];

	const allMarkers = [...organizationsMarkers, ...warehousesMarkers];

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[95vh]">
				<div className="text-center text-gray-500">Загрузка карты...</div>
			</div>
		);
	}

	return <Map markers={allMarkers} height="95vh" />;
}
