import { warehouseHistoryService } from '@/services/warehouseHistoryService';
import {
	WAREHOUSE_HISTORY_TYPE_LABELS,
	WAREHOUSE_HISTORY_TYPE_COLORS,
} from '@shared/constants/warehouseHistoryTypes';
import { formatDateToDDMMYYYY } from '@/utils/dateFormatters';
import type { WarehouseHistoryItemWithDetails } from '@shared/models';
import type { Column } from '@/components/shared/Table/types';
import { Link } from 'react-router';
import { EntityList } from '@/components/shared/EntityList';

interface HistoryEntry {
	id: number;
	operation_type: string;
	operation_type_color: string;
	old_amount: number;
	new_amount: number;
	delta: string;
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
	{ key: 'operation_type', label: 'Тип операции' },
	{ key: 'material_name', label: 'Материал' },
	{ key: 'old_amount', label: 'Было' },
	{ key: 'new_amount', label: 'Стало' },
	{ key: 'delta', label: 'Изменение' },
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
	operation_type: WAREHOUSE_HISTORY_TYPE_LABELS[item.operation_type],
	operation_type_color: WAREHOUSE_HISTORY_TYPE_COLORS[item.operation_type],
	old_amount: item.old_amount,
	new_amount: item.new_amount,
	delta: item.delta > 0 ? `+${item.delta}` : String(item.delta),
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
	return (
		<div className="mt-12">
			<div className="flex p-3 rounded-t-md border-b-0 border border-gray-100 justify-between items-center bg-white">
				<h2 className="text-xl font-semibold text-gray-900">История изменений</h2>
			</div>

			<EntityList
				roundedT={false}
				config={{
					entityName: 'warehouseHistory',
					itemName: 'Запись истории',
					service: {
						findAll: (page, limit, sortBy, sortOrder) =>
							warehouseHistoryService.getByWarehouseId(warehouseId, page, limit, sortBy, sortOrder),
						search: (query, page, limit, sortBy, sortOrder) =>
							warehouseHistoryService.search(warehouseId, query, page, limit, sortBy, sortOrder),
						delete: async () => {},
					},
					columns,
					mapToTableItem: mapHistoryToTableItem,
					actions: [], // Нет действий
					canCreate: false,
					initialSortBy: 'created_at',
					initialSortOrder: 'DESC',
					defaultLimit: 100,
				}}
			/>
		</div>
	);
}
