import { useParams } from 'react-router';
import { WarehouseInfo } from './WarehouseInfo';
import { WarehouseMaterials } from './WarehouseMaterials';
import { useQuery } from '@tanstack/react-query';
import { userService, warehouseService } from '@/services';

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
	const org_id = profile?.data.organization_id;

	const isCurrentUserOrg = org_id === warehouse?.data.organization_id;

	return (
		<>
			<WarehouseInfo id={id} role={role} isCurrentUserOrg={isCurrentUserOrg} />
			<WarehouseMaterials id={id} role={role} isCurrentUserOrg={isCurrentUserOrg} />
		</>
	);
}
