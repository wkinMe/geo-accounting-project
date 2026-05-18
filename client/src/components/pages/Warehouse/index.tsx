// client/src/pages/warehouses/Warehouse.tsx
import { useParams } from 'react-router';
import { WarehouseInfo } from './WarehouseInfo';
import { WarehouseMaterials } from './WarehouseMaterials';
import { useQuery } from '@tanstack/react-query';
import { warehouseService } from '@/services';
import {
	getWarehouseColor,
	isAdminRole,
	isManagerRole,
	isSuperAdminRole,
	isUserRole,
} from '@/utils';
import { WarehouseHistory } from './WarehouseHistory';
import { useProfile } from '@/hooks';
import { Map, type MapMarker } from '@/components/shared/Map';

export function Warehouse() {
	const params = useParams();
	const id = Number(params?.id);

	const { data: profile } = useProfile();

	const { data: warehouse } = useQuery({
		queryKey: ['warehouse', id],
		queryFn: () => warehouseService.findById(id),
	});

	const role = profile?.role;
	const isUser = isUserRole(role);
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

	// Маркер для карты
	const warehouseMarker: MapMarker[] = [];

	if (warehouse?.latitude && warehouse?.longitude) {
		warehouseMarker.push({
			id: warehouse.id,
			type: 'warehouse',
			position: [warehouse.latitude, warehouse.longitude],
			title: warehouse.name,
			subtitle: warehouse.organization?.name,
			iconColor: getWarehouseColor(orgId || 0, warehouse),
			description: `Менеджер: ${warehouse.manager?.name || 'Не назначен'}`,
		});
	}

	return (
		<>
			<WarehouseInfo id={id} canEdit={canEditWarehouse} canDelete={canDeleteWarehouse} />

			{/* Карта с расположением склада */}
			{warehouseMarker.length > 0 && (
				<div className="mt-12">
					<div className="flex p-3 rounded-t-md border-b-0 border-2 border-gray-100 justify-between items-center bg-white">
						<h2 className="text-xl font-semibold text-gray-900">Расположение склада</h2>
					</div>
					<div className="h-96">
						<Map
							markers={warehouseMarker}
							center={[warehouse!.latitude!, warehouse!.longitude!]}
							zoom={15}
							height="100%"
							enableSearch={false}
						/>
					</div>
				</div>
			)}

			<WarehouseMaterials id={id} canManage={canManageMaterials} />
			{isCurrentUserOrg && !isUser && <WarehouseHistory warehouseId={id} />}
		</>
	);
}
