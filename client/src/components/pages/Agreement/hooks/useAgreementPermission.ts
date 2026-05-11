// client/src/pages/Agreements/hooks/useAgreementPermissions.ts
import { useRole } from '@/hooks';
import { isAdminRole, isManagerRole, isSuperAdminRole } from '@/utils';
import { type AgreementStatus } from '@shared/constants';
import { IRREVERSIBLE_STATUSES } from '@shared/constants/agreementStatuses';

interface UseAgreementPermissionsParams {
	isViewMode: boolean;
	isCreateMode: boolean;
	agreementId?: number;
	initialStatus?: AgreementStatus | null;
}

export function useAgreementPermissions({
	isViewMode,
	isCreateMode,
	initialStatus,
}: UseAgreementPermissionsParams) {
	const role = useRole();
	const isSuperAdmin = isSuperAdminRole(role);
	const isAdmin = isAdminRole(role);
	const isManager = isManagerRole(role);

	// Для просмотра - запрещаем редактирование
	if (isViewMode) {
		return { canEdit: false, canEditPartyAndMaterials: false };
	}

	// При создании нового договора - разрешаем всё
	if (isCreateMode) {
		return { canEdit: true, canEditPartyAndMaterials: true };
	}

	// Если договор в необратимом статусе
	const isIrreversible = initialStatus && IRREVERSIBLE_STATUSES.includes(initialStatus);

	// Если договор уже в обороте (необратимый статус)
	if (isIrreversible) {
		// Супер-админ и админ могут редактировать всё
		if (isSuperAdmin || isAdmin) {
			return { canEdit: true, canEditPartyAndMaterials: true };
		}
		// Менеджер не может редактировать
		return { canEdit: false, canEditPartyAndMaterials: false };
	}

	// Если договор ещё не в обороте (черновик, ожидает подтверждения, отменён, просрочен)
	// Супер-админ, админ и менеджер могут редактировать
	if (isSuperAdmin || isAdmin || isManager) {
		return { canEdit: true, canEditPartyAndMaterials: true };
	}

	return { canEdit: false, canEditPartyAndMaterials: false };
}
