// src/components/pages/MapPage.tsx
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Map, MARKER_COLORS, type MapMarker, type SearchableItem } from '@/components/shared/Map';
import { warehouseService } from '@/services/warehouseService';
import { organizationService } from '@/services/organizationService';
import { useProfile } from '@/hooks';
import { atLeastManager } from '@/utils';
import type { Map as LeafletMap } from 'leaflet';
import { CreateAgreementModal } from './components/CreateAgreementModal';
import { useAgreementFormStore } from '@/components/pages/Agreement/store';
import type { WarehouseWithManagerAndOrganization } from '@shared/models';

export function MapPage() {
	const navigate = useNavigate();
	const mapRef = useRef<LeafletMap>(null);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedWarehouse, setSelectedWarehouse] = useState<{ id: number; name: string } | null>(
		null
	);

	const {
		setSupplierOrg,
		setSupplierWarehouse,
		setSupplierManager,
		setCustomerOrg,
		setCustomerWarehouse,
		setCustomerManager,
		resetForm,
	} = useAgreementFormStore();

	const { data: profile, isLoading: isLoadingProfile } = useProfile();

	// В MapPage.tsx
	const { data: warehousesResponse, isLoading: isLoadingWarehouses } = useQuery({
		queryKey: ['warehouses', 'map'],
		queryFn: async () => {
			if (atLeastManager(profile?.role)) {
				return await warehouseService.findAll(1, 1000);
			}
			return await warehouseService.findAll(
				1,
				1000,
				undefined,
				undefined,
				profile?.organization_id
			);
		},
		enabled: !!profile,
	});

	const { data: organizationsResponse, isLoading: isLoadingOrganizations } = useQuery({
		queryKey: ['organizations', 'map'],
		queryFn: async () => {
			if (atLeastManager(profile?.role)) {
				return await organizationService.findAll(1, 1000);
			}
			const singleOrg = await organizationService.findById(profile?.organization_id || 0);
			return { data: [singleOrg], pagination: { total: 1, page: 1, limit: 1, totalPages: 1 } };
		},
		enabled: !!profile,
	});

	const warehouses = warehousesResponse?.data || [];
	const organizations = organizationsResponse?.data || [];

	const isLoading = isLoadingProfile || isLoadingWarehouses || isLoadingOrganizations;
	const currentUserOrgId = profile?.organization_id;

	const searchableItems: SearchableItem[] = [
		...organizations
			.filter(
				(o) =>
					o.latitude !== undefined &&
					o.latitude !== null &&
					o.longitude !== undefined &&
					o.longitude !== null
			)
			.map((org) => ({
				id: org.id,
				type: 'organization' as const,
				name: org.name,
				subtitle: 'Головной офис',
				latitude: org.latitude!,
				longitude: org.longitude!,
			})),
		...warehouses
			.filter(
				(w) =>
					w.latitude !== undefined &&
					w.latitude !== null &&
					w.longitude !== undefined &&
					w.longitude !== null
			)
			.map((warehouse) => ({
				id: warehouse.id,
				type: 'warehouse' as const,
				name: warehouse.name,
				subtitle: warehouse.organization?.name || 'Склад',
				latitude: warehouse.latitude!,
				longitude: warehouse.longitude!,
			})),
	];

	const getOrganizationColor = (orgId: number) => {
		return orgId === currentUserOrgId ? MARKER_COLORS.OWN_ORG : MARKER_COLORS.OTHER_ORG;
	};

	const getWarehouseColor = (warehouse: WarehouseWithManagerAndOrganization) => {
		const isOwnOrg = warehouse.organization_id === currentUserOrgId;
		const hasManager = warehouse.manager_id !== null;

		if (isOwnOrg) {
			return hasManager ? MARKER_COLORS.OWN_WITH_MANAGER : MARKER_COLORS.OWN_NO_MANAGER;
		} else {
			return hasManager ? MARKER_COLORS.OTHER_WITH_MANAGER : MARKER_COLORS.OTHER_NO_MANAGER;
		}
	};

	const handleCreateAgreement = (warehouseId: number, warehouseName: string) => {
		setSelectedWarehouse({ id: warehouseId, name: warehouseName });
		setIsModalOpen(true);
	};

	const handleRoleSelect = (warehouseId: number, role: 'supplier' | 'customer') => {
		const warehouse = warehouses.find((w) => w.id === warehouseId);

		if (warehouse) {
			resetForm();

			if (role === 'supplier') {
				setSupplierOrg(warehouse.organization_id);
				setSupplierWarehouse(warehouse.id);
				setSupplierManager(warehouse.manager_id);
			} else {
				setCustomerOrg(warehouse.organization_id);
				setCustomerWarehouse(warehouse.id);
				setCustomerManager(warehouse.manager_id);
			}

			navigate('/agreements/new');
		}
	};

	const organizationsMarkers: MapMarker[] = organizations
		.filter(
			(o) =>
				o.latitude !== undefined &&
				o.latitude !== null &&
				o.longitude !== undefined &&
				o.longitude !== null
		)
		.map((org) => ({
			id: org.id,
			type: 'organization',
			position: [org.latitude!, org.longitude!],
			iconColor: getOrganizationColor(org.id),
			title: org.name,
			subtitle: 'Головной офис',
		}));

	const warehousesMarkers: MapMarker[] = warehouses
		.filter(
			(w) =>
				w.latitude !== undefined &&
				w.latitude !== null &&
				w.longitude !== undefined &&
				w.longitude !== null
		)
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
			onCreateAgreement: () => handleCreateAgreement(warehouse.id, warehouse.name),
		}));

	const allMarkers = [...organizationsMarkers, ...warehousesMarkers];

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[95vh]">
				<div className="text-center text-gray-500">Загрузка карты...</div>
			</div>
		);
	}

	return (
		<>
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

			{selectedWarehouse && (
				<CreateAgreementModal
					open={isModalOpen}
					setOpen={setIsModalOpen}
					warehouseId={selectedWarehouse.id}
					warehouseName={selectedWarehouse.name}
					onSelect={handleRoleSelect}
				/>
			)}
		</>
	);
}
