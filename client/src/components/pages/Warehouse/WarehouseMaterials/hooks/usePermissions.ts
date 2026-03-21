import { USER_ROLES } from '@/constants';
import type { UserRole } from '@shared/models';

export function useWarehouseMaterialsPermissions(role: UserRole, isCurrentUserOrg: boolean) {
	const allowed =
		(role === USER_ROLES.MANAGER && isCurrentUserOrg) ||
		(role === USER_ROLES.ADMIN && isCurrentUserOrg) ||
		role === USER_ROLES.SUPER_ADMIN;
	return {
		canEditAmount: allowed,
		canRemove: allowed,
		canAdd: allowed,
	};
}
