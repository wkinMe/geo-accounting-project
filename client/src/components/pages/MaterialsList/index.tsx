// client/src/pages/materials/MaterialsList.tsx
import { useState } from 'react';
import { materialService } from '@/services/materialService';
import { userService } from '@/services/userService';
import type { CreateMaterialDTO, UpdateMaterialDTO } from '@shared/dto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaRegEye, FaRegTrashAlt } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import type { Action, Column, HoverPopupConfig } from '@/components/shared/Table/types';
import { Table } from '@/components/shared/Table';
import { useNavigate } from 'react-router';
import { MaterialModal } from './components';
import { MaterialImagePopup } from './components/MaterialsImagePopup';

export type TableMaterial = {
	id: number;
	name: string;
	unit: string;
};

const columns: Column<TableMaterial>[] = [
	{ key: 'id', label: 'ID' },
	{ key: 'name', label: 'Название' },
	{ key: 'unit', label: 'Ед. измерения' },
];

const mapMaterialToTableItem = (material: any): TableMaterial => ({
	id: material.id,
	name: material.name,
	unit: material.unit,
});

export function MaterialsList() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedMaterial, setSelectedMaterial] = useState<TableMaterial | null>(null);

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
			if (selectedMaterial) {
				await queryClient.invalidateQueries({ queryKey: ['materialImage', selectedMaterial.id] });
			}
			setTimeout(() => {
				setIsModalOpen(false);
				setSelectedMaterial(null);
			}, 300);
		},
	});

	const elements =
		searchQuery && searchedMaterials
			? searchedMaterials.map(mapMaterialToTableItem)
			: materials?.map(mapMaterialToTableItem) || [];

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

	const canModify = () => isSuperAdmin;

	// Абстрактная конфигурация для попапа при наведении
	const hoverPopupConfig: HoverPopupConfig<TableMaterial> = {
		delay: 200,
		renderContent: (item) => <MaterialImagePopup materialId={item.id} />,
	};

	const actions: Action<TableMaterial>[] = [
		{
			name: 'Просмотреть',
			action: (item: TableMaterial) => navigate(`${item.id}`),
			icon: <FaRegEye />,
		},
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
				hoverPopupConfig={hoverPopupConfig}
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
