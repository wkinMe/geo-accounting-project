// src/components/pages/MapPage.tsx
import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Map, MARKER_COLORS, type MapMarker, type SearchableItem } from '@/components/shared/Map';
import { warehouseService } from '@/services/warehouseService';
import { organizationService } from '@/services/organizationService';
import { useProfile } from '@/hooks';
import { atLeastManager } from '@/utils';
import type { Map as LeafletMap } from 'leaflet';
import { useNavigate } from 'react-router';

export function MapPage() {
	const mapRef = useRef<LeafletMap>(null);

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

	// Подготовка данных для поиска
	const searchableItems: SearchableItem[] = [
		...(organizationsData?.data
			?.filter((o) => o.latitude && o.longitude)
			.map((org) => ({
				id: org.id,
				type: 'organization' as const,
				name: org.name,
				subtitle: 'Головной офис',
				latitude: org.latitude!,
				longitude: org.longitude!,
			})) || []),
		...(warehousesData?.data
			?.filter((w) => w.latitude && w.longitude)
			.map((warehouse) => ({
				id: warehouse.id,
				type: 'warehouse' as const,
				name: warehouse.name,
				subtitle: warehouse.organization?.name || 'Склад',
				latitude: warehouse.latitude!,
				longitude: warehouse.longitude!,
			})) || []),
	];

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
				onDetailsClick: () => {
					window.open(`/warehouses/${warehouse.id}`, '_blank');
				},
			})) || [];

	const allMarkers = [...organizationsMarkers, ...warehousesMarkers];

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[95vh]">
				<div className="text-center text-gray-500">Загрузка карты...</div>
			</div>
		);
	}

	return (
		<div className="h-[95vh]">
			<Map
				ref={mapRef}
				markers={allMarkers}
				searchableItems={searchableItems}
				enableSearch={true}
				searchPlaceholder="Поиск организаций и складов..."
				height="100%"
			/>
		</div>
	);
}
