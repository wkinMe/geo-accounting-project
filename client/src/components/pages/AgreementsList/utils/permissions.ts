// client/src/utils/agreementPermissions.ts
import type { UserDataDTO } from '@shared/dto';
import { USER_ROLES } from '@/constants';
import type { TableAgreement } from '../types';

/**
 * Проверка прав на редактирование договора
 */
export const canEditAgreement = (
	currentUser: UserDataDTO | null | undefined,
	agreement: TableAgreement
): boolean => {
	if (!currentUser) return false;

	// Super_admin может редактировать всё
	if (currentUser.role === USER_ROLES.SUPER_ADMIN) return true;

	// Admin может редактировать договоры своей организации
	if (currentUser.role === USER_ROLES.ADMIN) {
		// Проверяем по организации поставщика или покупателя
		if (
			currentUser.organization_id === agreement.supplier_organization_id ||
			currentUser.organization_id === agreement.customer_organization_id
		) {
			return true;
		}
	}

	// Менеджер может редактировать договоры, где он является подписантом
	if (currentUser.role === USER_ROLES.MANAGER) {
		// Проверяем по ID пользователя (подписанта)
		if (currentUser.id === agreement.supplier_id || currentUser.id === agreement.customer_id) {
			return true;
		}
		// Или если менеджер belongs к организации-участнику
		if (
			currentUser.organization_id === agreement.supplier_organization_id ||
			currentUser.organization_id === agreement.customer_organization_id
		) {
			return true;
		}
	}

	return false;
};

/**
 * Проверка прав на удаление договора
 */
export const canDeleteAgreement = (
	currentUser: UserDataDTO | null | undefined,
	agreement: TableAgreement
): boolean => {
	if (!currentUser) return false;

	// Super_admin может удалять всё
	if (currentUser.role === USER_ROLES.SUPER_ADMIN) return true;

	// Admin может удалять договоры своей организации
	if (currentUser.role === USER_ROLES.ADMIN) {
		if (
			currentUser.organization_id === agreement.supplier_organization_id ||
			currentUser.organization_id === agreement.customer_organization_id
		) {
			return true;
		}
	}

	// Менеджер может удалять договоры только если он подписант
	if (currentUser.role === USER_ROLES.MANAGER) {
		if (currentUser.id === agreement.supplier_id || currentUser.id === agreement.customer_id) {
			return true;
		}
	}

	return false;
};

/**
 * Проверка прав на создание нового договора
 */
export const canCreateAgreement = (currentUser: UserDataDTO | null | undefined): boolean => {
	if (!currentUser) return false;
	// Все, кроме обычных пользователей, могут создавать договоры
	return currentUser.role !== USER_ROLES.USER;
};
