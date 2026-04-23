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

export function MapPage() {
	const navigate = useNavigate();
	const mapRef = useRef<LeafletMap>(null);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedWarehouse, setSelectedWarehouse] = useState<{ id: number; name: string } | null>(
		null
	);

	// Получаем сеттеры из store
	const {
		setSupplierOrg,
		setSupplierWarehouse,
		setSupplierManager,
		setCustomerOrg,
		setCustomerWarehouse,
		setCustomerManager,
		resetForm,
	} = useAgreementFormStore();

	const profileQuery = useProfile();
	const profile = profileQuery.data;

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
				return [singleOrg];
			}
		},
	});

	const isLoading = isLoadingWarehouses || isLoadingOrganizations;
	const currentUserOrgId = profile?.organization_id;

	// Подготовка данных для поиска
	const searchableItems: SearchableItem[] = [
		...(organizationsData
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

	// Обработчик создания договора
	const handleCreateAgreement = (warehouseId: number, warehouseName: string) => {
		setSelectedWarehouse({ id: warehouseId, name: warehouseName });
		setIsModalOpen(true);
	};

	// Обработчик выбора роли
	const handleRoleSelect = (warehouseId: number, role: 'supplier' | 'customer') => {
		// Находим склад с данными об организации
		const warehouse = warehousesData?.data?.find((w) => w.id === warehouseId);

		if (warehouse) {
			// Сбрасываем предыдущие данные формы
			resetForm();

			if (role === 'supplier') {
				// Заполняем данные поставщика
				setSupplierOrg(warehouse.organization_id);
				setSupplierWarehouse(warehouse.id);
				setSupplierManager(warehouse.manager_id);
			} else {
				// Заполняем данные покупателя
				setCustomerOrg(warehouse.organization_id);
				setCustomerWarehouse(warehouse.id);
				setCustomerManager(warehouse.manager_id);
			}

			// Переход на страницу создания договора
			navigate('/agreements/new');
		}
	};

	const organizationsMarkers: MapMarker[] =
		organizationsData
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
				onCreateAgreement: () => handleCreateAgreement(warehouse.id, warehouse.name),
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

			{/* Модальное окно для выбора роли */}
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
