import { useQuery } from '@tanstack/react-query';
import { PaginatedTable } from '@/components/shared/PaginatedTable';
import { warehouseHistoryService } from '@/services/warehouseHistoryService';
import {
	WAREHOUSE_HISTORY_TYPE_LABELS,
	WAREHOUSE_HISTORY_TYPE_COLORS,
} from '@shared/constants/warehouseHistoryTypes';
import { formatDateToDDMMYYYY } from '@/utils/dateFormatters';
import type { WarehouseHistoryItemWithDetails } from '@shared/models';
import type { Column } from '@/components/shared/Table/types';
import { Link } from 'react-router';
import { useTablePagination } from '@/hooks/useTablePagination';

interface HistoryEntry {
	id: number;
	operation_type_display: string;
	operation_type_color: string;
	old_amount: number;
	new_amount: number;
	delta: number;
	delta_display: string;
	delta_color: string;
	description: string | null;
	created_at: string;
	material_name: string;
	material_unit: string;
	user_name: string | null;
	agreement_id: number | null;
}

const columns: Column<HistoryEntry>[] = [
	{ key: 'created_at', label: 'Дата и время' },
	{ key: 'operation_type_display', label: 'Тип операции' },
	{ key: 'material_name', label: 'Материал' },
	{ key: 'old_amount', label: 'Было' },
	{ key: 'new_amount', label: 'Стало' },
	{ key: 'delta_display', label: 'Изменение' },
	{ key: 'user_name', label: 'Пользователь' },
	{
		key: 'agreement_id',
		label: 'Договор',
		render: (value: number | null) => {
			if (!value) return <span>—</span>;
			return (
				<Link to={`/agreements/${value}`} className="cursor-pointer underline">
					Договор №{value}
				</Link>
			);
		},
	},
	{ key: 'description', label: 'Описание' },
];

const mapHistoryToTableItem = (item: WarehouseHistoryItemWithDetails): HistoryEntry => ({
	id: item.id,
	operation_type_display: WAREHOUSE_HISTORY_TYPE_LABELS[item.operation_type],
	operation_type_color: WAREHOUSE_HISTORY_TYPE_COLORS[item.operation_type],
	old_amount: item.old_amount,
	new_amount: item.new_amount,
	delta: item.delta,
	delta_display: item.delta > 0 ? `+${item.delta}` : String(item.delta),
	delta_color:
		item.delta > 0 ? 'text-green-600' : item.delta < 0 ? 'text-red-600' : 'text-gray-500',
	description: item.description,
	created_at:
		formatDateToDDMMYYYY(item.created_at) +
		' ' +
		new Date(item.created_at).toLocaleTimeString('ru-RU'),
	material_name: item.material?.name || '—',
	material_unit: item.material?.unit || '',
	user_name: item.user?.name || '—',
	agreement_id: item.agreement?.id || null,
});

export function WarehouseHistory({ warehouseId }: { warehouseId: number }) {
	const { page, limit, sortBy, sortOrder, handleSort, handlePageChange, handleLimitChange } =
		useTablePagination({
			initialPage: 1,
			initialLimit: 100,
			initialSortBy: 'created_at',
			initialSortOrder: 'DESC',
		});

	const { data, isLoading, isFetching } = useQuery({
		queryKey: ['warehouseHistory', warehouseId, page, limit, sortBy, sortOrder],
		queryFn: () =>
			warehouseHistoryService.getByWarehouseId(warehouseId, page, limit, sortBy, sortOrder),
		enabled: !!warehouseId,
		placeholderData: (previousData) => previousData,
	});

	const elements = data?.data.map(mapHistoryToTableItem) || [];
	const total = data?.pagination.total || 0;

	return (
		<div className="mt-12">
			<div className="flex p-3 rounded-t-md border-b-0 border-2 border-gray-100 justify-between items-center bg-white">
				<h2 className="text-xl font-semibold text-gray-900">История изменений</h2>
			</div>

			<PaginatedTable
				roundedT={false}
				roundedB={true}
				columns={columns}
				itemName="Запись истории"
				elements={elements}
				total={total}
				sortBy={sortBy}
				sortOrder={sortOrder}
				currentPage={page}
				currentLimit={limit}
				isLoading={isLoading}
				isFetching={isFetching}
				isCreateDisabled={true}
				onPageChange={handlePageChange}
				onLimitChange={handleLimitChange}
				onSort={handleSort}
			/>
		</div>
	);
}
