// client/src/pages/TopWarehouses/index.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Table } from '@/components/shared/Table';
import { materialService } from '@/services/materialService';
import { inventoryService } from '@/services/inventoryService';
import { warehouseService } from '@/services/warehouseService';
import { organizationService } from '@/services/organizationService';
import type { Material } from '@shared/models';
import type { Column, Action } from '@/components/shared/Table/types';
import { FaFileContract } from 'react-icons/fa';
import { useAgreementFormStore } from '../Agreement/store';
import { SearchableSelect } from '@/components/shared/SearchableSelect';

interface WarehouseItem {
	id: number;
	name: string;
	organizationId: number | null;
	organizationName: string;
	managerId: number | null;
	amount: number;
}

const columns: Column<WarehouseItem>[] = [
	{ key: 'name', label: 'Склад' },
	{ key: 'organizationName', label: 'Организация' },
	{ key: 'amount', label: 'Количество' },
];

export function TopWarehouses() {
	const navigate = useNavigate();
	const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
	const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
	const [materialSearchQuery, setMaterialSearchQuery] = useState('');

	const {
		resetForm,
		setSupplierOrg,
		setSupplierManager,
		setSupplierWarehouse,
		addMaterial,
		materials: agreementMaterials,
		setOrgSearchQuery,
		setSupplierManagerSearchQuery,
		setCustomerManagerSearchQuery,
		setSupplierWarehouseSearchQuery,
		setCustomerWarehouseSearchQuery,
		setMaterialSearchQuery: setStoreMaterialSearchQuery,
	} = useAgreementFormStore();

	// Поиск материалов
	const { data: materialsData, isLoading: isLoadingMaterials } = useQuery({
		queryKey: ['materials', 'search', materialSearchQuery],
		queryFn: () => materialService.search(materialSearchQuery),
		enabled: materialSearchQuery.length > 0,
	});

	const { data: allMaterials, isLoading: isLoadingAllMaterials } = useQuery({
		queryKey: ['materials'],
		queryFn: () => materialService.findAll(),
		enabled: materialSearchQuery.length === 0,
	});

	// Получение топ складов по выбранному материалу
	const { data: warehousesData, isLoading: isLoadingWarehouses } = useQuery({
		queryKey: ['materialWarehouses', selectedMaterialId],
		queryFn: async () => {
			if (!selectedMaterialId) return [];

			const topWarehouses = await inventoryService.findTopWarehousesByMaterial(
				selectedMaterialId,
				100
			);

			const warehousesWithDetails = await Promise.all(
				topWarehouses.map(async (item) => {
					try {
						const warehouse = await warehouseService.findById(item.warehouse_id);
						let organizationName = '';
						let organizationId = null;

						if (warehouse.organization_id) {
							organizationId = warehouse.organization_id;
							try {
								const organization = await organizationService.findById(warehouse.organization_id);
								organizationName = organization.name;
							} catch {
								organizationName = `Организация №${warehouse.organization_id}`;
							}
						}

						return {
							id: item.warehouse_id,
							name: warehouse.name,
							organizationId: organizationId,
							organizationName: organizationName || '—',
							managerId: warehouse.manager_id || null,
							amount: item.amount,
						};
					} catch {
						return {
							id: item.warehouse_id,
							name: `Склад №${item.warehouse_id}`,
							organizationId: null,
							organizationName: '—',
							managerId: null,
							amount: item.amount,
						};
					}
				})
			);

			return warehousesWithDetails.sort((a, b) => b.amount - a.amount);
		},
		enabled: !!selectedMaterialId,
	});

	const materialOptions = (materialSearchQuery ? materialsData?.data : allMaterials?.data) || [];

	const handleMaterialSelect = (id: number | null) => {
		setSelectedMaterialId(id);
		const material = materialOptions.find((m) => m.id === id);
		setSelectedMaterial(material || null);
	};

	const handleCreateAgreement = (warehouse: WarehouseItem) => {
		// Полный сброс перед установкой новых данных
		resetForm();
		setOrgSearchQuery('');
		setSupplierManagerSearchQuery('');
		setCustomerManagerSearchQuery('');
		setSupplierWarehouseSearchQuery('');
		setCustomerWarehouseSearchQuery('');
		setStoreMaterialSearchQuery('');

		if (warehouse.organizationId) {
			setSupplierOrg(warehouse.organizationId);
		}
		setSupplierWarehouse(warehouse.id);
		if (warehouse.managerId) {
			setSupplierManager(warehouse.managerId);
		}
		if (
			selectedMaterial &&
			!agreementMaterials.some((m) => m.material_id === selectedMaterial.id)
		) {
			addMaterial({
				material_id: selectedMaterial.id,
				name: selectedMaterial.name,
				amount: 1,
				maxAmount: warehouse.amount,
				item_price: 0,
			});
		}
		navigate('/agreements/new', { state: { preserveData: true } });
	};

	const actions: Action<WarehouseItem>[] = [
		{
			name: 'Сформировать договор',
			action: (item) => handleCreateAgreement(item),
			icon: <FaFileContract />,
		},
	];

	const elements: WarehouseItem[] = warehousesData || [];

	return (
		<div className="max-w-7xl mx-auto p-6 space-y-8">
			<h1 className="text-2xl font-bold">Поиск материалов по складам</h1>

			<div className="w-full">
				<SearchableSelect<Material>
					label="Материал"
					value={selectedMaterialId}
					onChange={handleMaterialSelect}
					options={materialOptions}
					onSearch={setMaterialSearchQuery}
					isLoading={isLoadingMaterials || isLoadingAllMaterials}
					getOptionLabel={(material) => `${material.name} (${material.unit})`}
					placeholder="Поиск материала..."
					required
				/>
			</div>

			{selectedMaterialId && (
				<div className="mt-12">
					<div className="flex p-3 rounded-t-md border-b-0 border-2 border-gray-100 justify-between items-center bg-white">
						<h2 className="text-xl font-semibold text-gray-900">
							Склады с наибольшим количеством выбранного материала
						</h2>
					</div>

					<Table
						roundedT={false}
						itemName="склад"
						columns={columns}
						elements={elements}
						actions={actions}
						isCreateDisabled={true}
					/>
				</div>
			)}
		</div>
	);
}
