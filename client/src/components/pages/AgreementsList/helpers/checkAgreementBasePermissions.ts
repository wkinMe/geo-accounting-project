// client/src/components/pages/AgreementsList/helpers/agreementBasePermissions.ts
import { USER_ROLES } from '@/constants';
import type { UserDataDTO } from '@shared/dto';

// Функция для проверки прав на основе роли пользователя
export const checkAgreementBasePermissions = (currentUser: UserDataDTO | undefined) => {
	// Все пользователи, которые видят договор, могут его редактировать
	const canEdit = (): boolean => {
		if (!currentUser) return false;
		// Все, кроме обычных пользователей, могут редактировать
		return currentUser.role !== USER_ROLES.USER;
	};

	// Все пользователи, которые видят договор, могут его удалять
	const canDelete = (): boolean => {
		if (!currentUser) return false;
		// Все, кроме обычных пользователей, могут удалять
		return currentUser.role !== USER_ROLES.USER;
	};

	// Проверка прав на создание нового договора
	const canCreate = (): boolean => {
		if (!currentUser) return false;
		// Все, кроме обычных пользователей, могут создавать договоры
		return currentUser.role !== USER_ROLES.USER;
	};

	return {
		canEdit,
		canDelete,
		canCreate,
	};
};
