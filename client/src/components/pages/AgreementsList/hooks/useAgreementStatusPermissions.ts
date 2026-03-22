// client/src/components/pages/AgreementsList/hooks/useAgreementStatusPermissions.ts
import { useProfile } from '@/hooks';
import type { AgreementFormState } from '../../Agreement/types';
import { checkAgreementStatusPermissions } from '../helpers/checkAgreementStatusPermissions';

export const useAgreementStatusPermissions = (agreement: AgreementFormState) => {
	const { data: currentUserData } = useProfile();
	const currentUser = currentUserData?.data;

	return checkAgreementStatusPermissions(currentUser, agreement);
};
