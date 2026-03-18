import { USER_ROLES } from '@/constants';
import type { UserRole } from '@shared/models';

export function isAdminRole(role: UserRole) {
	return role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN;
}

export function isManagerRole(role: UserRole) {
	return role === USER_ROLES.MANAGER;
}

export function atLeastManager(role: UserRole) {
	return isAdminRole(role) || isManagerRole(role);
}
