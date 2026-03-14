import type { UserRole } from '@shared/models';

export function isAdminRole(role: UserRole) {
	return role === 'admin' || role === 'super_admin';
}

export function isManagerRole(role: UserRole) {
	return role === 'manager';
}

export function atLeastManager(role: UserRole) {
	return isAdminRole(role) || isManagerRole(role);
}
