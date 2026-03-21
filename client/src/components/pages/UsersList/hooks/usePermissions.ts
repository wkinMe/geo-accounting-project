import type { UserDataDTO } from '@shared/dto';
import type { TableUser } from '../types';
import { USER_ROLES } from '@/constants';

export function useUsersListPermissions(currentUser: UserDataDTO | undefined) {
	// Проверка прав на редактирование пользователя
	const canEdit = (user: TableUser) => {
		if (!currentUser) return false;

		if (currentUser.role === USER_ROLES.SUPER_ADMIN) return true;

		if (currentUser.role === USER_ROLES.ADMIN) {
			if (
				(user.role === USER_ROLES.MANAGER || user.role === USER_ROLES.USER) &&
				currentUser.organization_id === user.organization_id
			) {
				return true;
			}
			return false;
		}

		return false;
	};

	const canDelete = (user: TableUser) => {
		if (!currentUser) return false;

		if (user.id === currentUser.id) return false;

		if (currentUser.role === USER_ROLES.SUPER_ADMIN) return true;

		if (currentUser.role === USER_ROLES.ADMIN) {
			if (
				(user.role === USER_ROLES.MANAGER || user.role === USER_ROLES.USER) &&
				currentUser.organization_id === user.organization_id
			) {
				return true;
			}
			return false;
		}

		return false;
	};

	const canMakeAdmin = (user: TableUser) => {
		if (!currentUser) return false;

		if (user.id === currentUser.id) return false;

		if (currentUser.role === USER_ROLES.SUPER_ADMIN) return true;
		if (currentUser.role === USER_ROLES.ADMIN) {
			if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN) return false;

			if (
				(user.role === USER_ROLES.MANAGER || user.role === USER_ROLES.USER) &&
				currentUser.organization_id === user.organization_id
			) {
				return true;
			}
			return false;
		}

		return false;
	};

	const canMakeSuperAdmin = (user: TableUser) => {
		if (!currentUser) return false;

		if (currentUser.role !== USER_ROLES.SUPER_ADMIN) return false;

		if (user.role === USER_ROLES.SUPER_ADMIN) return false;

		return true;
	};

	return {
		canEdit,
		canDelete,
		canMakeAdmin,
		canMakeSuperAdmin,
	};
}
