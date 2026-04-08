// client/src/pages/Agreements/components/AgreementMap/index.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import {
	Map,
	MARKER_COLORS,
	type MapMarker,
	type SearchableItem,
	type MapHandle,
} from '@/components/shared/Map';
import { warehouseService } from '@/services/warehouseService';
import { useQuery } from '@tanstack/react-query';
import type { WarehouseWithMaterialsAndOrganization } from '@shared/models';
import type { Map as LeafletMap } from 'leaflet';

interface AgreementMapProps {
	supplierWarehouseId: number | null;
	customerWarehouseId: number | null;
	onSupplierSelect: (warehouse: WarehouseWithMaterialsAndOrganization) => void;
	onCustomerSelect: (warehouse: WarehouseWithMaterialsAndOrganization) => void;
	readOnly?: boolean;
}

const SUPPLIER_COLOR = '#1a1a1a';
const CUSTOMER_COLOR = '#dc2626';
const DEFAULT_COLOR = MARKER_COLORS.OTHER_WITH_MANAGER;

export function AgreementMap({
	supplierWarehouseId,
	customerWarehouseId,
	onSupplierSelect,
	onCustomerSelect,
	readOnly = false,
}: AgreementMapProps) {
	const mapRef = useRef<LeafletMap>(null);
	const [selectedWarehouses, setSelectedWarehouses] = useState<{
		supplier: WarehouseWithMaterialsAndOrganization | null;
		customer: WarehouseWithMaterialsAndOrganization | null;
	}>({ supplier: null, customer: null });

	// Получаем все склады
	const { data: warehousesData, isLoading } = useQuery({
		queryKey: ['warehouses', 'map'],
		queryFn: () => warehouseService.findAll(),
	});

	// Загружаем выбранные склады по ID
	const { data: supplierWarehouse } = useQuery({
		queryKey: ['warehouse', supplierWarehouseId],
		queryFn: () => warehouseService.findById(supplierWarehouseId!),
		enabled: !!supplierWarehouseId && !selectedWarehouses.supplier,
	});

	const { data: customerWarehouse } = useQuery({
		queryKey: ['warehouse', customerWarehouseId],
		queryFn: () => warehouseService.findById(customerWarehouseId!),
		enabled: !!customerWarehouseId && !selectedWarehouses.customer,
	});

	// Синхронизация пропсов с внутренним состоянием (обработка удаления)
	useEffect(() => {
		if (supplierWarehouseId === null && selectedWarehouses.supplier !== null) {
			setSelectedWarehouses((prev) => ({ ...prev, supplier: null }));
		}
	}, [supplierWarehouseId, selectedWarehouses.supplier]);

	useEffect(() => {
		if (customerWarehouseId === null && selectedWarehouses.customer !== null) {
			setSelectedWarehouses((prev) => ({ ...prev, customer: null }));
		}
	}, [customerWarehouseId, selectedWarehouses.customer]);

	// Синхронизируем выбранные склады из пропсов (для загрузки существующих)
	useEffect(() => {
		if (supplierWarehouse?.data && !selectedWarehouses.supplier) {
			setSelectedWarehouses((prev) => ({ ...prev, supplier: supplierWarehouse.data }));
		}
	}, [supplierWarehouse]);

	useEffect(() => {
		if (customerWarehouse?.data && !selectedWarehouses.customer) {
			setSelectedWarehouses((prev) => ({ ...prev, customer: customerWarehouse.data }));
		}
	}, [customerWarehouse]);

	// Синхронизация выбранных складов из store
	useEffect(() => {
		if (supplierWarehouseId && warehousesData?.data) {
			const found = warehousesData.data.find((w) => w.id === supplierWarehouseId);
			if (found && found !== selectedWarehouses.supplier) {
				setSelectedWarehouses((prev) => ({ ...prev, supplier: found }));
			}
		}
	}, [supplierWarehouseId, warehousesData]);

	useEffect(() => {
		if (customerWarehouseId && warehousesData?.data) {
			const found = warehousesData.data.find((w) => w.id === customerWarehouseId);
			if (found && found !== selectedWarehouses.customer) {
				setSelectedWarehouses((prev) => ({ ...prev, customer: found }));
			}
		}
	}, [customerWarehouseId, warehousesData]);

	// Обработчик клика по маркеру
	const handleMarkerClick = (warehouse: WarehouseWithMaterialsAndOrganization) => {
		if (readOnly) return;

		// Если склад уже выбран как поставщик или покупатель, не даём выбрать заново
		if (
			selectedWarehouses.supplier?.id === warehouse.id ||
			selectedWarehouses.customer?.id === warehouse.id
		) {
			return;
		}

		// Логика выбора:
		// 1. Если нет поставщика - выбираем поставщика
		// 2. Если есть поставщик, но нет покупателя - выбираем покупателя
		// 3. Если нет поставщика, но есть покупатель - выбираем поставщика
		if (!selectedWarehouses.supplier) {
			// Выбираем поставщика
			setSelectedWarehouses((prev) => ({ ...prev, supplier: warehouse }));
			onSupplierSelect(warehouse);
		} else if (!selectedWarehouses.customer) {
			// Выбираем покупателя
			setSelectedWarehouses((prev) => ({ ...prev, customer: warehouse }));
			onCustomerSelect(warehouse);
		}
	};

	// Фильтруем склады для отображения
	const displayWarehouses = useMemo(() => {
		const allWarehouses = warehousesData?.data;
		if (!allWarehouses) return [];

		// Если выбраны оба склада, показываем только их
		if (selectedWarehouses.supplier && selectedWarehouses.customer) {
			return [selectedWarehouses.supplier, selectedWarehouses.customer];
		}

		// Если выбран только поставщик
		if (selectedWarehouses.supplier) {
			return [
				selectedWarehouses.supplier,
				...allWarehouses.filter((w) => w.id !== selectedWarehouses.supplier?.id),
			];
		}

		// Если выбран только покупатель
		if (selectedWarehouses.customer) {
			return [
				selectedWarehouses.customer,
				...allWarehouses.filter((w) => w.id !== selectedWarehouses.customer?.id),
			];
		}

		// Если ничего не выбрано, показываем все склады
		return allWarehouses;
	}, [warehousesData, selectedWarehouses]);

	// Обработчик для перехода на страницу склада
	const handleWarehouseDetails = (warehouseId: number) => {
		window.open(`/warehouses/${warehouseId}`, '_blank');
	};

	// Преобразуем склады в маркеры
	const markers: MapMarker[] = useMemo(() => {
		return displayWarehouses
			.filter((warehouse) => warehouse.latitude && warehouse.longitude)
			.map((warehouse) => {
				let iconColor: string = DEFAULT_COLOR;
				let subtitle = warehouse.organization?.name || 'Склад';

				if (selectedWarehouses.supplier?.id === warehouse.id) {
					iconColor = SUPPLIER_COLOR;
					subtitle = 'Поставщик';
				} else if (selectedWarehouses.customer?.id === warehouse.id) {
					iconColor = CUSTOMER_COLOR;
					subtitle = 'Покупатель';
				}

				return {
					id: warehouse.id,
					type: 'warehouse',
					position: [warehouse.latitude!, warehouse.longitude!],
					iconColor,
					title: warehouse.name,
					subtitle,
					data: warehouse,
					onClick: () => handleMarkerClick(warehouse),
					onDetailsClick: () => handleWarehouseDetails(warehouse.id),
				};
			});
	}, [displayWarehouses, selectedWarehouses]);

	// Преобразуем склады в формат SearchableItem
	const searchableItems: SearchableItem[] = useMemo(() => {
		const allWarehouses = warehousesData?.data;
		if (!allWarehouses) return [];

		return allWarehouses
			.filter((warehouse) => warehouse.latitude && warehouse.longitude)
			.map((warehouse) => ({
				id: warehouse.id,
				type: 'warehouse' as const,
				name: warehouse.name,
				subtitle: warehouse.organization?.name || 'Склад',
				latitude: warehouse.latitude!,
				longitude: warehouse.longitude!,
			}));
	}, [warehousesData]);

	// Проверяем, выбраны ли оба склада
	const bothSelected = !!(selectedWarehouses.supplier && selectedWarehouses.customer);

	// Поиск включаем только если не выбраны оба склада и не readOnly
	const enableSearch = !bothSelected && !readOnly;

	// Определяем, кого сейчас выбираем
	const getSelectionHint = () => {
		if (bothSelected) return null;
		if (!selectedWarehouses.supplier) return '👆 Выберите склад поставщика';
		if (!selectedWarehouses.customer) return '👆 Выберите склад покупателя';
		return null;
	};

	const selectionHint = getSelectionHint();

	if (isLoading) {
		return (
			<div className="h-[500px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
				<span className="text-gray-500">Загрузка карты...</span>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-semibold">Выбор складов на карте</h3>
				{selectionHint && !readOnly && <div className="text-sm text-gray-500">{selectionHint}</div>}
			</div>

			{/* Используем встроенный Map с поиском */}
			<div className="h-[450px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
				<Map
					ref={mapRef}
					markers={markers}
					height="100%"
					enableSearch={enableSearch}
					searchableItems={searchableItems}
					searchPlaceholder="Поиск складов..."
					onMarkerClick={(marker) => {
						if (marker.onClick) marker.onClick();
					}}
				/>
			</div>

			{/* Легенда */}
			<div className="flex gap-4 text-sm">
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 rounded-full" style={{ backgroundColor: SUPPLIER_COLOR }} />
					<span>Поставщик</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 rounded-full" style={{ backgroundColor: CUSTOMER_COLOR }} />
					<span>Покупатель</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 rounded-full" style={{ backgroundColor: DEFAULT_COLOR }} />
					<span>Доступные склады</span>
				</div>
			</div>

			{/* Информация о выбранных складах */}
			<div className="grid grid-cols-2 gap-4 mt-2">
				<div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
					<div className="text-sm font-medium text-gray-500">Поставщик</div>
					<div className="mt-1">
						{selectedWarehouses.supplier ? (
							<>
								<div className="font-medium">{selectedWarehouses.supplier.name}</div>
								<div className="text-sm text-gray-500">
									{selectedWarehouses.supplier.organization?.name}
								</div>
							</>
						) : (
							<div className="text-gray-400">Не выбран</div>
						)}
					</div>
				</div>
				<div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
					<div className="text-sm font-medium text-gray-500">Покупатель</div>
					<div className="mt-1">
						{selectedWarehouses.customer ? (
							<>
								<div className="font-medium">{selectedWarehouses.customer.name}</div>
								<div className="text-sm text-gray-500">
									{selectedWarehouses.customer.organization?.name}
								</div>
							</>
						) : (
							<div className="text-gray-400">Не выбран</div>
						)}
					</div>
				</div>
			</div>

			{/* Подсказка, когда оба склада выбраны */}
			{bothSelected && !readOnly && (
				<div className="text-center text-sm text-green-600 dark:text-green-400 py-2">
					✓ Оба склада выбраны. Для изменения выберите другой склад на карте.
				</div>
			)}
		</div>
	);
}
