// client/src/components/pages/AgreementsList/helpers/agreementStatusPermissions.ts
import {
	getTransitions,
	AGREEMENT_STATUS,
	type AgreementStatus,
	USER_ROLES,
} from '@shared/constants';
import type { UserDataDTO } from '@shared/dto';
import type { AgreementFormState } from '../../Agreement/types';
import { atLeastAdmin, isManagerRole } from '@/utils';

// Функция для проверки прав на изменение статуса
export const checkAgreementStatusPermissions = (
	currentUser: UserDataDTO | undefined,
	agreement: AgreementFormState
) => {
	const role = currentUser?.role;
	const atLeastAdminRole = atLeastAdmin(role);
	const isManager = isManagerRole(role);

	// Проверка прав на изменение статуса
	const canChangeStatus = (newStatus: AgreementStatus): boolean => {
		if (!currentUser || !agreement) return true;

		// Суперадмин и администратор может всё
		if (atLeastAdminRole) return true;

		// Менеджер может только двигать статусы вперёд после активации
		if (isManager) {
			// Получаем доступные статусы для менеджера из конфигурации
			const availableStatuses = getTransitions(currentUser.role, agreement.status);
			return availableStatuses.includes(newStatus);
		}

		return false;
	};

	// Получение доступных статусов
	const getAvailableStatuses = (): AgreementStatus[] => {
		if (!currentUser || !agreement) return Object.values(AGREEMENT_STATUS);

		// Суперадмин и администратор видит все статусы
		if (atLeastAdminRole) return Object.values(AGREEMENT_STATUS);

		// Менеджер использует конфигурацию переходов
		if (currentUser.role === USER_ROLES.MANAGER) {
			return getTransitions(currentUser.role, agreement.status);
		}

		return [];
	};

	// Проверка заблокирован ли статус
	const isStatusLocked = (): boolean => {
		if (!currentUser || !agreement) return false;

		// Суперадмин не имеет блокировок
		if (atLeastAdminRole) return false;

		// Отменённый договор заблокирован для всех кроме администраторов
		if (agreement.status === AGREEMENT_STATUS.CANCELLED) return true;

		// Просроченный договор заблокирован для всех кроме администраторов
		if (agreement.status === AGREEMENT_STATUS.EXPIRED) return true;

		return false;
	};

	return {
		canChangeStatus,
		getAvailableStatuses,
		isStatusLocked: isStatusLocked(),
	};
};
