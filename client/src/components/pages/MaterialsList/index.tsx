// client/src/pages/materials/MaterialsList.tsx
import { useState } from 'react';
import { materialService } from '@/services/materialService';
import { userService } from '@/services/userService';
import type { CreateMaterialDTO, UpdateMaterialDTO } from '@shared/dto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import { MaterialModal } from './components';
import type { Action, Column } from '@/components/shared/Table/types';
import { Table } from '@/components/shared/Table';

export type TableMaterial = {
	id: number;
	name: string;
	unit: string;
	created_at: string;
	updated_at: string;
};

const columns: Column<TableMaterial>[] = [
	{ key: 'id', label: 'ID' },
	{ key: 'name', label: 'Название' },
	{ key: 'unit', label: 'Ед. измерения' },
	{ key: 'created_at', label: 'Дата добавления' },
	{ key: 'updated_at', label: 'Дата изменения' },
];

const mapMaterialToTableItem = (material: any): TableMaterial => ({
	id: material.id,
	name: material.name,
	unit: material.unit,
	created_at: new Date(material.created_at).toLocaleDateString('ru-RU'),
	updated_at: new Date(material.updated_at).toLocaleDateString('ru-RU'),
});

export function MaterialsList() {
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedMaterial, setSelectedMaterial] = useState<{
		id: number;
		name: string;
		unit: string;
		created_at: string;
		updated_at: string;
	} | null>(null);

	// Получаем текущего пользователя
	const { data: currentUserData } = useQuery({
		queryKey: ['currentUser'],
		queryFn: () => userService.getProfile(),
		retry: false,
	});

	const currentUser = currentUserData?.data;
	const isSuperAdmin = currentUser?.role === 'super_admin';

	const { data: materials } = useQuery({
		queryKey: ['materials'],
		queryFn: () => materialService.findAll(),
	});

	const { data: searchedMaterials } = useQuery({
		queryKey: ['materials', 'search', searchQuery],
		queryFn: () => materialService.search(searchQuery),
		enabled: searchQuery.length > 0,
		retry: false,
	});

	const { mutateAsync: deleteMutate } = useMutation({
		mutationFn: async (id: number) => materialService.delete(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['materials'] });
		},
	});

	const { mutateAsync: createMutate, isPending: isCreating } = useMutation({
		mutationFn: async (data: CreateMaterialDTO) => materialService.create(data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['materials'] });
			setTimeout(() => {
				setIsModalOpen(false);
				setSelectedMaterial(null);
			}, 300);
		},
	});

	const { mutateAsync: updateMutate, isPending: isUpdating } = useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateMaterialDTO }) =>
			materialService.update(id, data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['materials'] });
			setTimeout(() => {
				setIsModalOpen(false);
				setSelectedMaterial(null);
			}, 300);
		},
	});

	const elements =
		searchQuery && searchedMaterials
			? searchedMaterials.data.map(mapMaterialToTableItem)
			: materials?.data.map(mapMaterialToTableItem) || [];

	const openEditModal = (material: TableMaterial) => {
		setSelectedMaterial(material);
		setTimeout(() => {
			setIsModalOpen(true);
		}, 50);
	};

	const openCreateModal = () => {
		setSelectedMaterial(null);
		setIsModalOpen(true);
	};

	const handleSubmit = async (data: CreateMaterialDTO | UpdateMaterialDTO) => {
		if (selectedMaterial) {
			await updateMutate({ id: selectedMaterial.id, data: data as UpdateMaterialDTO });
		} else {
			await createMutate(data as CreateMaterialDTO);
		}
	};

	// Только суперадмин может редактировать и удалять
	const canModify = () => isSuperAdmin;

	const actions: Action<TableMaterial>[] = [
		{
			name: 'Редактировать',
			action: (item: TableMaterial) => openEditModal(item),
			icon: <MdEdit />,
			hidden: () => !canModify(),
		},
		{
			name: 'Удалить',
			action: async (item: TableMaterial) => {
				await deleteMutate(item.id);
			},
			icon: <FaRegTrashAlt />,
			needConfirmation: true,
			hidden: () => !canModify(),
		},
	];

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setTimeout(() => {
			setSelectedMaterial(null);
		}, 300);
	};

	return (
		<>
			<Table
				searchValue={searchQuery}
				onSearch={setSearchQuery}
				debounceMs={300}
				itemName="Материал"
				columns={columns}
				elements={elements}
				actions={actions}
				onCreate={canModify() ? openCreateModal : undefined}
			/>
			<MaterialModal
				open={isModalOpen}
				setOpen={(open) => {
					if (!open) handleCloseModal();
					else setIsModalOpen(true);
				}}
				material={selectedMaterial}
				onSubmit={handleSubmit}
				isLoading={isCreating || isUpdating}
			/>
		</>
	);
}
