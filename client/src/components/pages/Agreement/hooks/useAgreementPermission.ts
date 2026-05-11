// client/src/pages/Agreements/hooks/useAgreementPermissions.ts
import { useRole } from '@/hooks';
import { isAdminRole, isManagerRole, isSuperAdminRole } from '@/utils';
import { IRREVERSIBLE_STATUSES, type AgreementStatus } from '@shared/constants/agreementStatuses';

interface UseAgreementPermissionsParams {
	isViewMode: boolean;
	isCreateMode: boolean;
	agreementId?: number;
	initialStatus?: AgreementStatus | null;
}

export function useAgreementPermissions({
	isViewMode,
	isCreateMode,
	agreementId,
	initialStatus,
}: UseAgreementPermissionsParams) {
	const role = useRole();
	const isSuperAdmin = isSuperAdminRole(role);
	const isAdmin = isAdminRole(role);
	const isManager = isManagerRole(role);

	// Для просмотра - запрещаем редактирование
	if (isViewMode) {
		return { canEdit: false };
	}

	// При создании нового договора - разрешаем
	if (isCreateMode || !agreementId) {
		return { canEdit: true };
	}

	// Администратор и суперадминистратор могут редактировать всегда, независимо от статуса
	if (isSuperAdmin || isAdmin) {
		return { canEdit: true };
	}

	// Менеджер может редактировать только если договор не в необратимом статусе
	if (isManager && initialStatus && IRREVERSIBLE_STATUSES.includes(initialStatus)) {
		return { canEdit: false };
	}

	// Менеджер может редактировать (договор в обратимом статусе или менеджер без прав)
	return { canEdit: isManager };
}
