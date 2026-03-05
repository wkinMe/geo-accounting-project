import { Table, type Action } from '@/components/shared/Table';
import { warehouseService } from '@/services/warehouseService';
import type { UpdateWarehouseDTO } from '@shared/dto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaRegEye } from 'react-icons/fa';
import { FaRegTrashAlt } from 'react-icons/fa';
import { TbReportAnalytics } from 'react-icons/tb';
import { MdEdit } from 'react-icons/md';
import { useNavigate } from 'react-router';

// Важно: делаем headers const для вывода литеральных типов
const headers = ['id', 'name', 'manager', 'organization', 'created_at', 'updated_at'] as const;

// Правильное определение типа на основе headers
type WarehouseElement = {
	[K in (typeof headers)[number]]: K extends 'id' ? number : string;
};

export function WarehousesList() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: warehouses } = useQuery({
		queryKey: ['warehouses'],
		queryFn: () => warehouseService.findAll(),
	});

	const { mutate: deleteMutate } = useMutation({
		mutationFn: async (id: number) => warehouseService.delete(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['warehouses'] });
		},
	});

	const { mutate: editMutate } = useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateWarehouseDTO }) =>
			warehouseService.update(id, data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['warehouses'] });
		},
	});

	// Преобразуем данные в формат для таблицы
	const elements: WarehouseElement[] =
		warehouses?.data.map((w) => ({
			id: w.id,
			name: w.name,
			manager: w.manager?.name || '-',
			organization: w.organization.name,
			created_at: new Date(w.created_at).toLocaleDateString(),
			updated_at: new Date(w.updated_at).toLocaleDateString(),
		})) || [];

	// Действия работают с WarehouseElement
	const actions: Action<WarehouseElement>[] = [
		{
			name: 'details',
			action: (item) => navigate(`${item.id}`),
			icon: <FaRegEye />,
			popupName: 'Просмотреть',
		},
		{
			name: 'edit',
			action: (item) => {
				editMutate({
					id: item.id,
					data: { ...item },
				});
			},
			icon: <MdEdit />,
			popupName: 'Редактировать',
		},
		{
			name: 'delete',
			action: async (item) => deleteMutate(item.id),
			icon: <FaRegTrashAlt />,
			popupName: 'Удалить',
			needConfirmation: true,
		},
		{
			name: 'special',
			action: (item) => navigate(`/report/${item.id}`),
			icon: <TbReportAnalytics />,
			popupName: 'Сформировать отчёт',
		},
	];

	return <Table itemName="Склад" headers={headers} elements={elements} actions={actions} />;
}
