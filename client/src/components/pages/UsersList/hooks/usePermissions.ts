// client/src/pages/users/hooks/useUsersListPermissions.ts
import type { UserDataDTO } from '@shared/dto';
import type { TableUser } from '../types';
import { USER_ROLES } from '@shared/constants';

export function useUsersListPermissions(currentUser: UserDataDTO | undefined) {
	// Проверка прав на редактирование пользователя
	const canEdit = (user: TableUser) => {
		if (!currentUser) return false;

		console.log(user);

		// Супер-админ может редактировать всех
		if (currentUser.role === USER_ROLES.SUPER_ADMIN) return true;

		// Администратор может редактировать только менеджеров и обычных пользователей своей организации
		if (currentUser.role === USER_ROLES.ADMIN) {
			if (user.role === USER_ROLES.SUPER_ADMIN) return false;
			if (user.role === USER_ROLES.ADMIN) return false;
			return currentUser.organization_id === user.organization_id;
		}

		// Менеджер и обычный пользователь не могут редактировать
		return false;
	};

	// Проверка прав на удаление пользователя
	const canDelete = (user: TableUser) => {
		if (!currentUser) return false;

		// Нельзя удалить самого себя
		if (user.id === currentUser.id) return false;

		// Супер-админ может удалять всех, кроме себя
		if (currentUser.role === USER_ROLES.SUPER_ADMIN) return true;

		// Администратор может удалять только менеджеров и обычных пользователей своей организации
		if (currentUser.role === USER_ROLES.ADMIN) {
			if (user.role === USER_ROLES.SUPER_ADMIN) return false;
			if (user.role === USER_ROLES.ADMIN) return false;
			return currentUser.organization_id === user.organization_id;
		}

		return false;
	};

	// Проверка прав на назначение администратором
	const canMakeAdmin = (user: TableUser) => {
		if (!currentUser) return false;

		// Нельзя сделать администратором самого себя
		if (user.id === currentUser.id) return false;

		// Нельзя сделать администратором уже администратора или супер-админа
		if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN) return false;

		// Супер-админ может сделать администратором любого
		if (currentUser.role === USER_ROLES.SUPER_ADMIN) return true;

		// Администратор может сделать администратором только менеджера или пользователя своей организации
		if (currentUser.role === USER_ROLES.ADMIN) {
			return currentUser.organization_id === user.organization_id;
		}

		return false;
	};

	// Проверка прав на назначение главным администратором
	const canMakeSuperAdmin = (user: TableUser) => {
		if (!currentUser) return false;

		// Нельзя сделать супер-админом самого себя
		if (user.id === currentUser.id) return false;

		// Нельзя сделать супер-админом уже супер-админа
		if (user.role === USER_ROLES.SUPER_ADMIN) return false;

		// Только супер-админ может назначать супер-админов
		if (currentUser.role !== USER_ROLES.SUPER_ADMIN) return false;

		return true;
	};

	// Проверка прав на просмотр пользователя (всегда true для авторизованных)
	const canView = (user: TableUser) => {
		if (!currentUser) return false;

		// Супер-админ видит всех
		if (currentUser.role === USER_ROLES.SUPER_ADMIN) return true;

		// Администратор видит только пользователей своей организации
		if (currentUser.role === USER_ROLES.ADMIN) {
			return currentUser.organization_id === user.organization_id;
		}

		// Менеджер и обычный пользователь видят только себя
		return user.id === currentUser.id;
	};

	return {
		canEdit,
		canDelete,
		canMakeAdmin,
		canMakeSuperAdmin,
		canView,
	};
}
