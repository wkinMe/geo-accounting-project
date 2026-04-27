// client/src/pages/warehouses/Warehouse.tsx
import { useParams } from 'react-router';
import { WarehouseInfo } from './WarehouseInfo';
import { WarehouseMaterials } from './WarehouseMaterials';
import { useQuery } from '@tanstack/react-query';
import { warehouseService } from '@/services';
import { isAdminRole, isManagerRole, isSuperAdminRole } from '@/utils';
import { WarehouseHistory } from './WarehouseHistory';
import { useProfile } from '@/hooks';

export function Warehouse() {
	const params = useParams();
	const id = Number(params?.id);

	const { data: profile } = useProfile();

	const { data: warehouse } = useQuery({
		queryKey: ['warehouse', id],
		queryFn: () => warehouseService.findById(id),
	});

	const role = profile?.role;
	const userId = profile?.id;
	const orgId = profile?.organization_id;

	const isCurrentUserOrg = orgId === warehouse?.organization_id;
	const isCurrentUserManager = warehouse?.manager?.id === userId;

	const canEditWarehouse =
		isSuperAdminRole(role) ||
		(isAdminRole(role) && isCurrentUserOrg) ||
		(isManagerRole(role) && isCurrentUserManager);

	const canDeleteWarehouse = isSuperAdminRole(role) || (isAdminRole(role) && isCurrentUserOrg);

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
