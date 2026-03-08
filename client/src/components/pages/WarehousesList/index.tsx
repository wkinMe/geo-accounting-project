// client/src/pages/warehouses/WarehousesList.tsx
import { useState } from 'react';
import { Table, type Action } from '@/components/shared/Table';
import { EditWarehouseModal } from './EditWarehouseModal';
import { warehouseService } from '@/services/warehouseService';
import type { UpdateWarehouseDTO } from '@shared/dto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaRegEye } from 'react-icons/fa';
import { FaRegTrashAlt } from 'react-icons/fa';
import { TbReportAnalytics } from 'react-icons/tb';
import { MdEdit } from 'react-icons/md';
import { useNavigate } from 'react-router';
import { mapWarehouseToTableItem } from './utils';

const headers = ['id', 'name', 'manager', 'organization', 'created_at', 'updated_at'] as const;

export function WarehousesList() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState('');

	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

	const { mutateAsync: updateMutate, isPending: isUpdating } = useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateWarehouseDTO }) =>
			warehouseService.update(id, data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['warehouses'] });
			setTimeout(() => {
				setIsEditModalOpen(false);
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
			setIsEditModalOpen(true);
		}, 50);
	};

	const handleUpdate = async (id: number, data: UpdateWarehouseDTO) => {
		await updateMutate({ id, data });
	};

	const actions: Action<(typeof elements)[0]>[] = [
		{
			name: 'details',
			action: (item) => navigate(`${item.id}`),
			icon: <FaRegEye />,
			popupName: 'Просмотреть',
		},
		{
			name: 'edit',
			action: (item) => openEditModal(item),
			icon: <MdEdit />,
			popupName: 'Редактировать',
		},
		{
			name: 'special',
			action: (item) => navigate(`/report/${item.id}`),
			icon: <TbReportAnalytics />,
			popupName: 'Сформировать отчёт',
		},
		{
			name: 'delete',
			action: async (item) => {
				await deleteMutate(item.id);
			},
			icon: <FaRegTrashAlt />,
			popupName: 'Удалить',
			needConfirmation: true,
		},
	];

	const handleSearch = (query: string) => {
		if (query) {
			setSearchQuery(query);
		} else {
			return;
		}
	};

	return (
		<>
			<Table
				searchValue={searchQuery}
				onSearch={handleSearch}
				debounceMs={300}
				itemName="Склад"
				headers={headers}
				elements={elements}
				actions={actions}
			/>

			{selectedWarehouse && (
				<EditWarehouseModal
					open={isEditModalOpen}
					setOpen={setIsEditModalOpen}
					warehouse={{
						id: selectedWarehouse.id,
						name: selectedWarehouse.name,
						organization_id: selectedWarehouse.organization_id,
						manager_id: selectedWarehouse.managerId,
						latitude: selectedWarehouse.latitude,
						longitude: selectedWarehouse.longitude,
					}}
					onUpdate={handleUpdate}
				/>
			)}

			{isUpdating && (
				<div className="fixed bottom-4 right-4 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
					<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
							fill="none"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
					<span>Сохранение...</span>
				</div>
			)}
		</>
	);
}
