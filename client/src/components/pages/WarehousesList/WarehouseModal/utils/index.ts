import { isAdminRole, isManagerRole, isSuperAdminRole } from '@/utils';
import type { UserDataDTO } from '@shared/dto';
import type { WarehouseModalData } from '../types';

export const getManagerFieldAvailable = (
	user: UserDataDTO | undefined,
	warehouse: WarehouseModalData | undefined,
	isCreation: boolean
) => {
	if (isCreation) {
		return true;
	}
	if (user && warehouse) {
		const { role } = user;

		return (
			isSuperAdminRole(role) ||
			(isAdminRole(role) && user.organization_id === warehouse.organization_id) ||
			(isManagerRole(role) && user.organization_id === warehouse.organization_id)
		);
	}
};
