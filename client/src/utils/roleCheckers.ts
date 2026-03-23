import { USER_ROLES } from '@shared/constants';
import type { UserRole } from '@shared/models';

export function isSuperAdminRole(role: UserRole) {
	return role === USER_ROLES.SUPER_ADMIN;
}

export function isAdminRole(role: UserRole) {
	return role === USER_ROLES.ADMIN;
}

export function isManagerRole(role: UserRole) {
	return role === USER_ROLES.MANAGER;
}

export function isUserRole(role: UserRole) {
	return role === USER_ROLES.USER;
}

export function atLeastAdmin(role: UserRole) {
	return isAdminRole(role) || isSuperAdminRole(role);
}

export function atLeastManager(role: UserRole) {
	return atLeastAdmin(role) || isManagerRole(role);
}
