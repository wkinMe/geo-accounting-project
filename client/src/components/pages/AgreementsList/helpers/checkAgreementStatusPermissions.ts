// client/src/components/pages/AgreementsList/helpers/agreementStatusPermissions.ts
import { USER_ROLES } from '@/constants';
import { getTransitions, AGREEMENT_STATUS, type AgreementStatus } from '@shared/constants';
import type { UserDataDTO } from '@shared/dto';
import type { AgreementFormState } from '../../Agreement/types';

// Функция для проверки прав на изменение статуса
export const checkAgreementStatusPermissions = (
	currentUser: UserDataDTO | undefined,
	agreement: AgreementFormState
) => {
	// Проверка прав на изменение статуса
	const canChangeStatus = (newStatus: AgreementStatus): boolean => {
		if (!currentUser || !agreement) return true;

		// Суперадмин может всё
		if (currentUser.role === USER_ROLES.SUPER_ADMIN) return true;

		// Администратор может всё (у него в списке только его договоры)
		if (currentUser.role === USER_ROLES.ADMIN) return true;

		// Менеджер может только двигать статусы вперёд после активации
		if (currentUser.role === USER_ROLES.MANAGER) {
			// Получаем доступные статусы для менеджера из конфигурации
			const availableStatuses = getTransitions(currentUser.role, agreement.status);
			return availableStatuses.includes(newStatus);
		}

		return false;
	};

	// Получение доступных статусов
	const getAvailableStatuses = (): AgreementStatus[] => {
		if (!currentUser || !agreement) return Object.values(AGREEMENT_STATUS);

		// Суперадмин видит все статусы
		if (currentUser.role === USER_ROLES.SUPER_ADMIN) return Object.values(AGREEMENT_STATUS);

		// Администратор видит все статусы
		if (currentUser.role === USER_ROLES.ADMIN) return Object.values(AGREEMENT_STATUS);

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
		if (currentUser.role === USER_ROLES.SUPER_ADMIN) return false;

		// Завершённый договор заблокирован для всех кроме суперадмина
		if (agreement.status === AGREEMENT_STATUS.COMPLETED) return true;

		// Отменённый договор заблокирован для всех кроме суперадмина
		if (agreement.status === AGREEMENT_STATUS.CANCELLED) return true;

		// Просроченный договор заблокирован для всех кроме суперадмина
		if (agreement.status === AGREEMENT_STATUS.EXPIRED) return true;

		return false;
	};

	return {
		canChangeStatus,
		getAvailableStatuses,
		isStatusLocked: isStatusLocked(),
	};
};
