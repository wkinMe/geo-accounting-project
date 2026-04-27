// client/src/pages/warehouses/WarehousesList.tsx
import { useState } from 'react';
import { warehouseService } from '@/services/warehouseService';
import type { CreateWarehouseDTO, UpdateWarehouseDTO } from '@shared/dto';
import type { WarehouseWithManagerAndOrganization } from '@shared/models';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaRegEye } from 'react-icons/fa';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import { useNavigate } from 'react-router';
import { mapWarehouseToTableItem } from './utils';
import { WarehouseModal } from './WarehouseModal';
import type { TableWarehouse } from './types';
import { useWarehousePermissions } from './hooks';
import type { Action, Column } from '@/components/shared/Table/types';
import { Table } from '@/components/shared/Table';
import { useProfile, useRole } from '@/hooks';
import { isSuperAdminRole } from '@/utils';

const columns: Column<TableWarehouse>[] = [
	{ key: 'id', label: 'ID' },
	{ key: 'name', label: 'Название' },
	{ key: 'manager', label: 'Менеджер' },
	{ key: 'organization', label: 'Организация' },
	{ key: 'created_at', label: 'Дата создания' },
	{ key: 'updated_at', label: 'Дата обновления' },
];

export function WarehousesList() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedWarehouse, setSelectedWarehouse] = useState<TableWarehouse | null>(null);

	const { canEdit, canDelete, canCreate } = useWarehousePermissions();

	const role = useRole();
	const { data: profile } = useProfile();

	const { data: warehouses } = useQuery({
		queryKey: ['warehouses'],
		queryFn: async () => {
			if (isSuperAdminRole(role)) {
				return await warehouseService.findAll();
			}
			return await warehouseService.findAll(profile?.organization_id);
		},
	});

	const { data: searchedWarehouses } = useQuery({
		queryKey: ['warehouses', 'search', searchQuery],
		queryFn: () => warehouseService.search(searchQuery),
		enabled: searchQuery.length > 0,
		retry: false,
	});

	const { mutateAsync: deleteMutate } = useMutation({
		mutationFn: async (id: number) => warehouseService.delete(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['warehouses'] });
		},
	});

	const { mutateAsync: createMutate, isPending: isCreating } = useMutation({
		mutationFn: async (data: CreateWarehouseDTO) => warehouseService.create(data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['warehouses'] });
			setIsModalOpen(false);
			setSelectedWarehouse(null);
		},
	});

	const { mutateAsync: updateMutate, isPending: isUpdating } = useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateWarehouseDTO }) =>
			warehouseService.update(id, data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['warehouses'] });
			setIsModalOpen(false);
			setSelectedWarehouse(null);
		},
	});

	const elements =
		searchQuery && searchedWarehouses
			? searchedWarehouses.map(mapWarehouseToTableItem)
			: warehouses?.map(mapWarehouseToTableItem) || [];

	const openEditModal = (warehouse: TableWarehouse) => {
		setSelectedWarehouse(warehouse);
		setIsModalOpen(true);
	};

	const openCreateModal = () => {
		setSelectedWarehouse(null);
		setIsModalOpen(true);
	};

	const handleSubmit = async (data: CreateWarehouseDTO | UpdateWarehouseDTO) => {
		if (selectedWarehouse) {
			await updateMutate({ id: selectedWarehouse.id, data: data as UpdateWarehouseDTO });
		} else {
			await createMutate(data as CreateWarehouseDTO);
		}
	};

	const actions: Action<TableWarehouse>[] = [
		{
			name: 'Просмотреть',
			action: (item: TableWarehouse) => navigate(`${item.id}`),
			icon: <FaRegEye />,
		},
		{
			name: 'Редактировать',
			action: (item: TableWarehouse) => openEditModal(item),
			icon: <MdEdit />,
			hidden: () => !canEdit,
		},
		{
			name: 'Удалить',
			action: async (item: TableWarehouse) => {
				await deleteMutate(item.id);
			},
			icon: <FaRegTrashAlt />,
			needConfirmation: true,
			hidden: () => !canDelete,
		},
	];

	return (
		<>
			<Table
				searchValue={searchQuery}
				onSearch={setSearchQuery}
				debounceMs={300}
				itemName="Склад"
				columns={columns}
				elements={elements}
				actions={actions}
				onCreate={canCreate() ? openCreateModal : undefined}
			/>
			<WarehouseModal
				open={isModalOpen}
				setOpen={setIsModalOpen}
				warehouse={
					selectedWarehouse
						? {
								id: selectedWarehouse.id,
								name: selectedWarehouse.name,
								organization_id: selectedWarehouse.organization_id,
								manager_id: selectedWarehouse.managerId,
								latitude: selectedWarehouse.latitude,
								longitude: selectedWarehouse.longitude,
							}
						: null
				}
				onSubmit={handleSubmit}
				isLoading={isCreating || isUpdating}
			/>
		</>
	);
}
