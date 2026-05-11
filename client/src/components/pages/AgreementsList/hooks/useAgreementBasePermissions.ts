// client/src/pages/agreements/hooks/useAgreementBasePermissions.ts
import { useProfile } from '@/hooks';
import { atLeastAdmin, isManagerRole, isSuperAdminRole, isUserRole } from '@/utils';
import { AGREEMENT_STATUS, USER_ROLES, type AgreementStatus } from '@shared/constants';
import { FINISH_STATUSES } from '@shared/constants/agreementStatuses';

export const useAgreementBasePermissions = () => {
	const { data: currentUser } = useProfile();

	const canEdit = (status: AgreementStatus): boolean => {
		if (!currentUser) return false;

		if (
			isUserRole(currentUser.role) ||
			(FINISH_STATUSES.includes(status) && isManagerRole(currentUser.role))
		)
			return false;

		return true;
	};

	const canDelete = (status: AgreementStatus): boolean => {
		if (!currentUser) return false;

		// Супер-админ может удалить любой договор
		if (isSuperAdminRole(currentUser.role)) return true;

		// Администратор может удалить договор в любом статусе
		if (atLeastAdmin(currentUser.role)) return true;

		// Менеджер может удалить только если договор в статусе черновика
		if (currentUser.role === USER_ROLES.MANAGER && status === AGREEMENT_STATUS.DRAFT) {
			return true;
		}

		return false;
	};

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
