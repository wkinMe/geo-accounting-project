import { useParams } from 'react-router';
import { WarehouseInfo } from './WarehouseInfo';
import { WarehouseMaterials } from './WarehouseMaterials';
import { useQuery } from '@tanstack/react-query';
import { userService, warehouseService } from '@/services';
import { isAdminRole, isManagerRole, isSuperAdminRole } from '@/utils';
import { WarehouseHistory } from './WarehouseHistory';

export function Warehouse() {
	const params = useParams();
	const id = Number(params?.id);

	const { data: profile } = useQuery({
		queryKey: ['profile'],
		queryFn: () => userService.getProfile(),
	});

	const { data: warehouse } = useQuery({
		queryKey: ['warehouse', id],
		queryFn: () => warehouseService.findById(id),
	});

	const role = profile?.data.role;
	const userId = profile?.data.id;
	const orgId = profile?.data.organization_id;

	const isCurrentUserOrg = orgId === warehouse?.data.organization_id;
	const isCurrentUserManager = warehouse?.data.manager?.id === userId;

	// Проверка прав на редактирование
	const canEditWarehouse =
		isSuperAdminRole(role) ||
		(isAdminRole(role) && isCurrentUserOrg) ||
		(isManagerRole(role) && isCurrentUserManager);

	// Проверка прав на удаление
	const canDeleteWarehouse = isSuperAdminRole(role) || (isAdminRole(role) && isCurrentUserOrg);

	// Проверка прав на добавление/удаление материалов
	const canManageMaterials =
		isSuperAdminRole(role) ||
		(isAdminRole(role) && isCurrentUserOrg) ||
		(isManagerRole(role) && isCurrentUserManager);

	return (
		<>
			<WarehouseInfo id={id} canEdit={canEditWarehouse} canDelete={canDeleteWarehouse} />
			<WarehouseMaterials id={id} canManage={canManageMaterials} />
			<WarehouseHistory warehouseId={id} />
		</>
	);
}
