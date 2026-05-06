// client/src/pages/warehouses/WarehouseMaterials.tsx
import { inventoryService } from '@/services/inventoryService';
import type { InventoryItemWithMaterial } from '@/services/inventoryService';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import type { Action, Column } from '@/components/shared/Table/types';
import { EntityList } from '@/components/shared/EntityList';
import { WarehouseMaterialModal } from './WarehouseMaterialModal';
import { useQueryClient } from '@tanstack/react-query';

type TableMaterial = {
	id: number;
	material_id: number;
	name: string;
	amount: number;
	unit: string;
};

const columns: Column<TableMaterial>[] = [
	{ key: 'name', label: 'Название' },
	{ key: 'amount', label: 'Количество' },
	{ key: 'unit', label: 'Ед. измерения' },
];

const mapInventoryToTableItem = (item: InventoryItemWithMaterial): TableMaterial => ({
	id: item.id,
	material_id: item.material_id,
	name: item.material.name,
	amount: item.amount,
	unit: item.material.unit,
});

interface Props {
	id: number;
	canManage?: boolean;
}

export function WarehouseMaterials({ id, canManage = false }: Props) {
	const queryClient = useQueryClient();

	const handleRemoveMaterial = async (materialId: number, amount: number) => {
		await inventoryService.removeMaterial(id, materialId, amount);
		await queryClient.invalidateQueries({ queryKey: ['warehouseMaterials', id] });
		await queryClient.invalidateQueries({ queryKey: ['warehouseHistory', id] });
	};

	const actions: Action<TableMaterial>[] = [
		{
			name: 'Редактировать количество',
			icon: <MdEdit />,
			hidden: () => !canManage,
		},
		{
			name: 'Удалить материал со склада',
			action: async (item) => {
				await handleRemoveMaterial(item.material_id, item.amount);
			},
			icon: <FaRegTrashAlt />,
			confirmationBody: (item) => (
				<div className="space-y-2">
					<p>Вы уверены, что хотите удалить материал со склада?</p>
					<p className="font-medium">{item.name}</p>
					<p>Количество: {item.amount}</p>
				</div>
			),
			needConfirmation: true,
			hidden: () => !canManage,
		},
	];

	return (
		<div className="mt-12">
			<div className="flex p-3 rounded-t-md border-b-0 border border-gray-100 justify-between items-center bg-white">
				<h2 className="text-xl font-semibold text-gray-900">Материалы на складе</h2>
			</div>

			<EntityList
				roundedT={false}
				config={{
					entityName: 'warehouseMaterials',
					itemName: 'материал',
					service: {
						findAll: (page, limit, sortBy, sortOrder) =>
							inventoryService.getWarehouseStock(id, page, limit, sortBy, sortOrder),
						search: (query, page, limit, sortBy, sortOrder) =>
							inventoryService.searchMaterialsPaginated(id, query, page, limit, sortBy, sortOrder),
						delete: async (materialId) => {
							await inventoryService.setAmount(id, materialId, 0);
						},
						create: async (data) => {
							const { material_id, amount } = data;
							return await inventoryService.addMaterial(id, material_id, amount);
						},
						update: async (materialId, data) => {
							const { amount } = data;
							return await inventoryService.setAmount(id, materialId, amount);
						},
					},
					columns,
					mapToTableItem: mapInventoryToTableItem,
					actions,
					canCreate: canManage,
					initialSortBy: 'material_name',
					initialSortOrder: 'ASC',
					defaultLimit: 20,
					getIdField: (item) => item.material_id, // используем material_id вместо id
					renderModal: ({ open, setOpen, selectedItem, onSubmit }) => (
						<WarehouseMaterialModal
							open={open}
							setOpen={setOpen}
							warehouseId={id}
							selectedItem={selectedItem}
							onSubmit={onSubmit}
							onSuccess={() => {
								queryClient.invalidateQueries({ queryKey: ['warehouseMaterials', id] });
								queryClient.invalidateQueries({ queryKey: ['warehouseHistory', id] });
							}}
						/>
					),
				}}
			/>
		</div>
	);
}
