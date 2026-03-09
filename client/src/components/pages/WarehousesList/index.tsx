// client/src/pages/warehouses/WarehousesList.tsx
import { useState } from 'react';
import { Table, type Action } from '@/components/shared/Table';
import { warehouseService } from '@/services/warehouseService';
import type { CreateWarehouseDTO, UpdateWarehouseDTO } from '@shared/dto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaRegEye } from 'react-icons/fa';
import { FaRegTrashAlt } from 'react-icons/fa';
import { TbReportAnalytics } from 'react-icons/tb';
import { MdEdit } from 'react-icons/md';
import { useNavigate } from 'react-router';
import { mapWarehouseToTableItem } from './utils';
import { WarehouseModal } from './WarehouseModal';

const headers = ['id', 'name', 'manager', 'organization', 'created_at', 'updated_at'] as const;

export function WarehousesList() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState('');

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedWarehouse, setSelectedWarehouse] = useState<{
		id: number;
		name: string;
		manager?: string;
		managerId?: number | null;
		organization: string;
		organization_id: number;
		latitude?: number;
		longitude?: number;
		created_at: string;
		updated_at: string;
	} | null>(null);

	const { data: warehouses } = useQuery({
		queryKey: ['warehouses'],
		queryFn: () => warehouseService.findAll(),
	});

	const { data: searchedWarehouses } = useQuery({
		queryKey: ['warehouses', searchQuery],
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

	const {
		mutateAsync: createMutate,
		isPending: isCreating,
	} = useMutation({
		mutationFn: async (data: CreateWarehouseDTO) => warehouseService.create(data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['warehouses'] });
			setTimeout(() => {
				setIsModalOpen(false);
				setSelectedWarehouse(null);
			}, 300);
		},
	});

	const {
		mutateAsync: updateMutate,
		isPending: isUpdating,
	} = useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateWarehouseDTO }) =>
			warehouseService.update(id, data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['warehouses'] });
			setTimeout(() => {
				setIsModalOpen(false);
				setSelectedWarehouse(null);
			}, 300);
		},
	});

	const elements =
		searchQuery && searchedWarehouses
			? searchedWarehouses.data.map(mapWarehouseToTableItem)
			: warehouses?.data.map(mapWarehouseToTableItem) || [];

	const openEditModal = (warehouse: (typeof elements)[0]) => {
		setSelectedWarehouse(warehouse);
		setTimeout(() => {
			setIsModalOpen(true);
		}, 50);
	};

	const openCreateModal = () => {
		setSelectedWarehouse(null);
		setIsModalOpen(true);
	};

	const handleSubmit = async (data: CreateWarehouseDTO | UpdateWarehouseDTO) => {
		if (selectedWarehouse) {
			// Режим редактирования
			await updateMutate({ id: selectedWarehouse.id, data: data as UpdateWarehouseDTO });
		} else {
			// Режим создания
			await createMutate(data as CreateWarehouseDTO);
		}
	};

	const actions: Action<(typeof elements)[0]>[] = [
		{
			name: 'Просмотреть',
			action: (item) => navigate(`${item.id}`),
			icon: <FaRegEye />,
		},
		{
			name: 'Редактировать',
			action: (item) => openEditModal(item),
			icon: <MdEdit />,
		},
		{
			name: 'Сформировать отчёт',
			action: (item) => navigate(`/report/${item.id}`),
			icon: <TbReportAnalytics />,
		},
		{
			name: 'Удалить',
			action: async (item) => {
				await deleteMutate(item.id);
			},
			icon: <FaRegTrashAlt />,
			needConfirmation: true,
		},
	];

	return (
		<>
			<Table
				searchValue={searchQuery}
				onSearch={setSearchQuery}
				debounceMs={300}
				itemName="Склад"
				headers={headers}
				elements={elements}
				actions={actions}
				onCreate={openCreateModal}
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
