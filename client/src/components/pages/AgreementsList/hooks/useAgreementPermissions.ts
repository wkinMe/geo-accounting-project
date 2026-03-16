// client/src/hooks/useAgreementPermissions.ts
import { useMemo } from 'react';
import type { UserDataDTO } from '@shared/dto';
import type { TableAgreement } from '../types';
import {
	canEditAgreement as checkCanEdit,
	canDeleteAgreement as checkCanDelete,
	canCreateAgreement as checkCanCreate,
} from '../utils';

interface UseAgreementPermissionsReturn {
	canEdit: (agreement: TableAgreement) => boolean;
	canDelete: (agreement: TableAgreement) => boolean;
	canCreate: boolean;
}

export const useAgreementPermissions = (
	currentUser: UserDataDTO | null | undefined
): UseAgreementPermissionsReturn => {
	// Мемоизируем функции, чтобы они не пересоздавались при каждом рендере
	const canEdit = useMemo(
		() => (agreement: TableAgreement) => checkCanEdit(currentUser, agreement),
		[currentUser]
	);

	const canDelete = useMemo(
		() => (agreement: TableAgreement) => checkCanDelete(currentUser, agreement),
		[currentUser]
	);

	const canCreate = useMemo(() => checkCanCreate(currentUser), [currentUser]);

	return {
		canEdit,
		canDelete,
		canCreate,
	};
};
