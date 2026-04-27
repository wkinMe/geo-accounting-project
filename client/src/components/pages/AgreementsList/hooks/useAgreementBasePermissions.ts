// client/src/components/pages/AgreementsList/hooks/useAgreementBasePermissions.ts
import { useProfile } from '@/hooks';
import { checkAgreementBasePermissions } from '../helpers';

// Хук для списка договоров
export const useAgreementBasePermissions = () => {
	const { data: currentUserData } = useProfile();
	const currentUser = currentUserData;

	return checkAgreementBasePermissions(currentUser);
};