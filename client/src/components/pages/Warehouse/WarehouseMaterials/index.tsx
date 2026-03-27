// client/src/pages/warehouses/WarehouseMaterials.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseService } from '@/services/warehouseService';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import { AddMaterialModal } from './AddMaterialModal';
import { EditAmountModal } from './EditMaterialAmountModal';
import { mapWarehouseMaterialToTableItem, type TableMaterial } from './utils';
import type { Action, Column } from '@/components/shared/Table/types';
import { Table } from '@/components/shared/Table';

const columns: Column<TableMaterial>[] = [
	{ key: 'id', label: 'ID' },
	{ key: 'name', label: 'Название' },
	{ key: 'amount', label: 'Количество' },
	{ key: 'unit', label: 'Ед. измерения' },
	{ key: 'created_at', label: 'Дата добавления' },
	{ key: 'updated_at', label: 'Дата обновления' },
];

interface Props {
	id: number;
	canManage?: boolean;
}

export function WarehouseMaterials({ id, canManage = false }: Props) {
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState('');

	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [editingMaterial, setEditingMaterial] = useState<{
		id: number;
		name: string;
		amount: number;
	} | null>(null);

	// Получение всех материалов со склада
	const { data: materials } = useQuery({
		queryKey: ['warehouseMaterials', id],
		queryFn: () => warehouseService.getMaterials(id),
	});

	// Поиск материалов на складе
	const { data: searchedMaterials } = useQuery({
		queryKey: ['warehouseMaterials', id, searchQuery],
		queryFn: () => warehouseService.searchMaterials(id, searchQuery),
		enabled: searchQuery.length > 0,
		retry: false,
	});

	// Мутация для удаления материала со склада
	const { mutateAsync: removeMaterialMutate } = useMutation({
		mutationFn: ({ materialId }: { materialId: number }) =>
			warehouseService.removeMaterial(id, materialId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['warehouseMaterials', id] });
		},
	});

	// Мутация для обновления количества
	const { mutateAsync: updateAmountMutate } = useMutation({
		mutationFn: ({ materialId, amount }: { materialId: number; amount: number }) =>
			warehouseService.updateMaterialAmount(id, materialId, amount),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['warehouseMaterials', id] });
			setEditingMaterial(null);
		},
	});

	const elements =
		searchQuery && searchedMaterials
			? searchedMaterials.data.map(mapWarehouseMaterialToTableItem)
			: materials?.data.map(mapWarehouseMaterialToTableItem) || [];

	const handleUpdateAmount = async (materialId: number, amount: number) => {
		await updateAmountMutate({ materialId, amount });
	};

	const actions: Action<TableMaterial>[] = [
		{
			name: 'Редактировать количество',
			action: (item) =>
				setEditingMaterial({
					id: item.material_id,
					name: item.material.name,
					amount: item.amount,
				}),
			icon: <MdEdit />,
			hidden: () => !canManage,
		},
		{
			name: 'Удалить материал со склада',
			action: async (item) => {
				await removeMaterialMutate({ materialId: item.material_id });
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
		<>
			<div className="mt-12">
				<div className="flex p-3 rounded-t-md border-b-0 border-2 border-gray-100 justify-between items-center bg-white">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white ">
						Материалы на складе
					</h2>
				</div>

				<Table
					roundedT={false}
					searchValue={searchQuery}
					onSearch={setSearchQuery}
					debounceMs={300}
					itemName="Материал"
					columns={columns}
					elements={elements}
					actions={actions}
					isCreateDisabled={!canManage}
					onCreate={() => setIsAddModalOpen(true)}
				/>
			</div>

			{/* Модалка добавления материала */}
			<AddMaterialModal
				open={isAddModalOpen}
				setOpen={setIsAddModalOpen}
				warehouseId={id}
				onSuccess={() => {
					queryClient.invalidateQueries({ queryKey: ['warehouseMaterials', id] });
				}}
			/>

			{/* Модалка редактирования количества */}
			{editingMaterial && (
				<EditAmountModal
					open={!!editingMaterial}
					setOpen={() => setEditingMaterial(null)}
					materialId={editingMaterial.id}
					materialName={editingMaterial.name}
					currentAmount={editingMaterial.amount}
					onSubmit={handleUpdateAmount}
				/>
			)}
		</>
	);
}
