import type { UserRole } from '@shared/models';

export function useWarehouseMaterialsPermissions(role: UserRole, isCurrentUserOrg: boolean) {
	const allowed =
		role === 'user' || (!isCurrentUserOrg && !(role === 'manager') && isCurrentUserOrg);
	return {
		canEditAmount: allowed,
		canRemove: allowed,
    canAdd: allowed,
	};
}
