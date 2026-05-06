// client/src/pages/warehouses/WarehousesList.tsx
import { warehouseService } from '@/services/warehouseService';
import type { WarehouseWithManagerAndOrganization } from '@shared/models';
import { FaRegEye, FaRegTrashAlt } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import type { Action, Column } from '@/components/shared/Table/types';
import { EntityList } from '@/components/shared/EntityList';
import { useNavigate } from 'react-router';
import { WarehouseModal } from './WarehouseModal';
import { useRole, useProfile } from '@/hooks';
import { isAdminRole, isManagerRole, isSuperAdminRole } from '@/utils';

type TableWarehouse = {
	id: number;
	name: string;
	manager: string;
	manager_id: number | null;
	organization: string;
	organization_id: number;
	latitude: number;
	longitude: number;
	created_at: string;
	updated_at: string;
};

const columns: Column<TableWarehouse>[] = [
	{ key: 'id', label: 'ID' },
	{ key: 'name', label: 'Название' },
	{ key: 'manager', label: 'Менеджер' },
	{ key: 'organization', label: 'Организация' },
];

const mapWarehouseToTableItem = (
	warehouse: WarehouseWithManagerAndOrganization
): TableWarehouse => ({
	id: warehouse.id,
	name: warehouse.name,
	manager: warehouse.manager?.name || '-',
	manager_id: warehouse.manager?.id || null,
	organization: warehouse.organization?.name || '-',
	organization_id: warehouse.organization_id,
	latitude: warehouse.latitude,
	longitude: warehouse.longitude,
	created_at: new Date(warehouse.created_at).toLocaleDateString('ru-RU'),
	updated_at: new Date(warehouse.updated_at).toLocaleDateString('ru-RU'),
});

export function WarehousesList() {
	const navigate = useNavigate();
	const role = useRole();
	const { data: profile } = useProfile();

	const isSuperAdmin = isSuperAdminRole(role);
	const isAdmin = isAdminRole(role);
	const isManager = isManagerRole(role);

	// Функции для проверки прав на основе данных склада
	const canEditWarehouse = (item: TableWarehouse) => {
		if (isSuperAdmin) return true;
		if (isAdmin && profile?.organization_id === item.organization_id) return true;
		if (isManager && profile?.id === item.manager_id) return true;
		return false;
	};

	const canDeleteWarehouse = (item: TableWarehouse) => {
		if (isSuperAdmin) return true;
		if (isAdmin && profile?.organization_id === item.organization_id) return true;
		return false;
	};

	const actions: Action<TableWarehouse>[] = [
		{
			name: 'Просмотреть',
			action: (item) => navigate(`${item.id}`),
			icon: <FaRegEye />,
		},
		{
			name: 'Редактировать',
			icon: <MdEdit />,
			hidden: (item) => !canEditWarehouse(item),
		},
		{
			name: 'Удалить',
			action: async () => {},
			icon: <FaRegTrashAlt />,
			needConfirmation: true,
			hidden: (item) => !canDeleteWarehouse(item),
		},
	];

	// Только обычный пользователь (не super_admin, не admin, не manager) получает фильтрацию
	const organizationId =
		!isSuperAdmin && !isAdmin && !isManager ? profile?.organization_id : undefined;

	return (
		<EntityList
			config={{
				entityName: 'warehouses',
				itemName: 'склад',
				service: {
					findAll: (page, limit, sortBy, sortOrder) =>
						warehouseService.findAll(page, limit, sortBy, sortOrder, organizationId),
					search: (query, page, limit, sortBy, sortOrder) =>
						warehouseService.search(query, page, limit, sortBy, sortOrder, organizationId),
					delete: warehouseService.delete.bind(warehouseService),
					create: warehouseService.create.bind(warehouseService),
					update: warehouseService.update.bind(warehouseService),
				},
				columns,
				mapToTableItem: mapWarehouseToTableItem,
				actions,
				canCreate: isSuperAdmin || role === 'admin',
				canEdit: canEditWarehouse,
				canDelete: canDeleteWarehouse,
				initialSortBy: 'id',
				initialSortOrder: 'ASC',
				defaultLimit: 20,
				renderModal: ({ open, setOpen, selectedItem, onSubmit }) => (
					<WarehouseModal
						open={open}
						setOpen={setOpen}
						warehouse={
							selectedItem
								? {
										id: selectedItem.id,
										name: selectedItem.name,
										organization_id: selectedItem.organization_id,
										manager_id: selectedItem.manager_id,
										latitude: selectedItem.latitude,
										longitude: selectedItem.longitude,
									}
								: null
						}
						onSubmit={onSubmit}
						isLoading={false}
					/>
				),
			}}
		/>
	);
}
