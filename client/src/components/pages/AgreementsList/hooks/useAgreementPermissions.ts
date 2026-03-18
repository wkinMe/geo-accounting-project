// client/src/pages/Agreements/hooks/useAgreementPermissions.ts
import { useProfile } from '@/hooks';
import type { TableAgreement } from '../types';
import { AGREEMENT_STATUS, STATUS_ORDER } from '@shared/constants/agreementStatuses';

// Статусы, которые нельзя откатить
const IRREVERSIBLE_STATUSES = ['active', 'in_progress', 'completed'];

export const useAgreementPermissions = (agreement?: TableAgreement | null) => {
	const { data: currentUserData } = useProfile();
	const currentUser = currentUserData?.data;

	// Проверка прав на редактирование договора
	const canEdit = (item: TableAgreement): boolean => {
		if (!currentUser) return false;

		// Super_admin может редактировать всё
		if (currentUser.role === 'super_admin') return true;

		// Admin может редактировать договоры своей организации
		if (currentUser.role === 'admin') {
			if (
				currentUser.organization_id === item.supplier_organization_id ||
				currentUser.organization_id === item.customer_organization_id
			) {
				return true;
			}
		}

		// Менеджер может редактировать договоры, где он является подписантом
		if (currentUser.role === 'manager') {
			if (currentUser.id === item.supplier_id || currentUser.id === item.customer_id) {
				return true;
			}
			// Или если менеджер belongs к организации-участнику
			if (
				currentUser.organization_id === item.supplier_organization_id ||
				currentUser.organization_id === item.customer_organization_id
			) {
				return true;
			}
		}

		return false;
	};

	// Проверка прав на удаление договора
	const canDelete = (item: TableAgreement): boolean => {
		if (!currentUser) return false;

		// Super_admin может удалять всё
		if (currentUser.role === 'super_admin') return true;

		// Admin может удалять договоры своей организации
		if (currentUser.role === 'admin') {
			if (
				currentUser.organization_id === item.supplier_organization_id ||
				currentUser.organization_id === item.customer_organization_id
			) {
				return true;
			}
		}

		// Менеджер может удалять договоры только если он подписант
		if (currentUser.role === 'manager') {
			if (currentUser.id === item.supplier_id || currentUser.id === item.customer_id) {
				return true;
			}
		}

		return false;
	};

	// Проверка прав на создание нового договора
	const canCreate = (): boolean => {
		if (!currentUser) return false;
		// Все, кроме обычных пользователей, могут создавать договоры
		return currentUser.role !== 'user';
	};

	// Проверка прав на изменение статуса
	const canChangeStatus = (newStatus: string): boolean => {
		if (!currentUser || !agreement) return true;

		// Суперадмин может всё
		if (currentUser.role === 'super_admin') return true;

		// Нельзя откатить с irreversible статусов
		if (IRREVERSIBLE_STATUSES.includes(agreement.status)) {
			// Можно только повышать статус (active -> in_progress -> completed)
			const currentIndex = STATUS_ORDER.indexOf(agreement.status as any);
			const newIndex = STATUS_ORDER.indexOf(newStatus as any);

			// Разрешаем только движение вперед по статусам
			if (newIndex <= currentIndex) {
				return false;
			}
		}

		// Завершённый договор может менять только суперадмин
		if (agreement.status === 'completed' && newStatus !== 'completed') {
			return false;
		}

		return true;
	};

	// Проверка заблокирован ли статус
	const isStatusLocked = (): boolean => {
		if (!currentUser || !agreement) return false;

		// Суперадмин не имеет блокировок
		if (currentUser.role === 'super_admin') return false;

		// Завершённый договор заблокирован для всех кроме суперадмина
		if (agreement.status === 'completed') return true;

		return false;
	};

	// Получение доступных статусов
	const getAvailableStatuses = (): string[] => {
		if (!currentUser || !agreement) return Object.values(AGREEMENT_STATUS);

		const allStatuses = Object.values(AGREEMENT_STATUS);

		// Суперадмин видит все статусы
		if (currentUser.role === 'super_admin') return allStatuses;

		// Для остальных - только доступные статусы
		return allStatuses.filter((status) => canChangeStatus(status));
	};

	return {
		canEdit,
		canDelete,
		canCreate,
		canChangeStatus,
		isStatusLocked: isStatusLocked(),
		getAvailableStatuses,
	};
};
