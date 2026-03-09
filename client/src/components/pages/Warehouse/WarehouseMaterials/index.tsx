// client/src/pages/warehouses/WarehouseMaterials.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, type Action } from '@/components/shared/Table';
import { Button } from '@/components/shared/Button';
import { warehouseService } from '@/services/warehouseService';
import { FaRegEye } from 'react-icons/fa';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import { IoAdd } from 'react-icons/io5';
import { useNavigate } from 'react-router';
import { AddMaterialModal } from './AddMaterialModal';
import { RemoveMaterialConfirmModal } from './RemoveMaterialConfirmModal';
import { EditAmountModal } from './EditMaterialAmountModal';
import { mapWarehouseMaterialToTableItem, type TableMaterial } from './utils';

const headers = ['id', 'name', 'amount'] as const;

interface Props {
	id: number;
}

export function WarehouseMaterials({ id }: Props) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState('');

	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [selectedMaterial, setSelectedMaterial] = useState<{
		id: number;
		name: string;
		amount: number;
	} | null>(null);
	const [editingMaterial, setEditingMaterial] = useState<{
		id: number;
		name: string;
		amount: number;
	} | null>(null);

	// Получение всех материалов со склада
	const { data: materials } = useQuery({
		queryKey: ['warehouse-materials', id],
		queryFn: () => warehouseService.getMaterials(id),
	});

	// Поиск материалов на складе
	const { data: searchedMaterials } = useQuery({
		queryKey: ['warehouse-materials', id, searchQuery],
		queryFn: () => warehouseService.searchMaterials(id, searchQuery),
		enabled: searchQuery.length > 0,
		retry: false,
	});

	// Мутация для удаления материала со склада
	const { mutateAsync: removeMaterialMutate, isPending: isRemoving } = useMutation({
		mutationFn: ({ materialId }: { materialId: number }) =>
			warehouseService.removeMaterial(id, materialId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['warehouse-materials', id] });
			setIsDeleteModalOpen(false);
			setSelectedMaterial(null);
		},
	});

	// Мутация для обновления количества
	const { mutateAsync: updateAmountMutate, isPending: isUpdating } = useMutation({
		mutationFn: ({ materialId, amount }: { materialId: number; amount: number }) =>
			warehouseService.updateMaterialAmount(id, materialId, amount),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['warehouse-materials', id] });
			setEditingMaterial(null);
		},
	});

	const elements =
		searchQuery && searchedMaterials
			? searchedMaterials.data.map(mapWarehouseMaterialToTableItem)
			: materials?.data.map(mapWarehouseMaterialToTableItem) || [];

	const handleRemoveMaterial = async () => {
		if (selectedMaterial) {
			await removeMaterialMutate({ materialId: selectedMaterial.id });
		}
	};

	const handleUpdateAmount = async (materialId: number, amount: number) => {
		await updateAmountMutate({ materialId, amount });
	};

	const actions: Action<TableMaterial>[] = [
		{
			name: 'Просмотреть',
			action: (item) => navigate(`/materials/${item.material.id}`),
			icon: <FaRegEye />,
		},
		{
			name: 'Редактировать количество',
			action: (item) =>
				setEditingMaterial({
					id: item.material_id,
					name: item.material.name,
					amount: item.amount,
				}),
			icon: <MdEdit />,
		},
		{
			name: 'Удалить со склада',
			action: (item) => {
				setSelectedMaterial({
					id: item.material_id,
					name: item.material.name,
					amount: item.amount,
				});
				setIsDeleteModalOpen(true);
			},
			icon: <FaRegTrashAlt />,
			needConfirmation: true,
		},
	];

	return (
		<>
			<div className="mt-12 space-y-4">
				<div className="flex justify-between items-center">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
						Материалы на складе
					</h2>
					<Button
						variant="primary"
						size="sm"
						onClick={() => setIsAddModalOpen(true)}
						startIcon={<IoAdd />}
					>
						Добавить материал
					</Button>
				</div>

				<Table
					searchValue={searchQuery}
					onSearch={setSearchQuery}
					debounceMs={300}
					itemName="Материал"
					headers={headers}
					elements={elements}
					actions={actions}
				/>
			</div>

			{/* Модалка добавления материала */}
			<AddMaterialModal
				open={isAddModalOpen}
				setOpen={setIsAddModalOpen}
				warehouseId={id}
				onSuccess={() => {
					queryClient.invalidateQueries({ queryKey: ['warehouse-materials', id] });
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

			{/* Модалка подтверждения удаления */}
			<RemoveMaterialConfirmModal
				open={isDeleteModalOpen}
				setOpen={setIsDeleteModalOpen}
				materialName={selectedMaterial?.name || ''}
				currentAmount={selectedMaterial?.amount || 0}
				onConfirm={handleRemoveMaterial}
			/>
		</>
	);
}
