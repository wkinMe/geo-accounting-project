import { useProfileData } from '@/hooks/useProfileData';
import type { TableWarehouse } from '../types';
import { USER_ROLES } from '@shared/constants';

export const useWarehousePermissions = () => {
	const profileData = useProfileData();

	const canEdit = (warehouse: TableWarehouse) => {
		if (!profileData) return false;

		if (profileData.role === USER_ROLES.SUPER_ADMIN) return true;

		if (
			profileData.role === USER_ROLES.ADMIN &&
			profileData.organization_id === warehouse.organization_id
		) {
			return true;
		}

		if (profileData.role === USER_ROLES.MANAGER && profileData.id === warehouse.managerId) {
			return true;
		}

		return false;
	};

	const canDelete = (warehouse: TableWarehouse) => {
		if (!profileData) return false;

		if (profileData.role === USER_ROLES.SUPER_ADMIN) return true;

		if (
			profileData.role === USER_ROLES.ADMIN &&
			profileData.organization_id === warehouse.organization_id
		) {
			return true;
		}

		return false;
	};

	const canCreate = () => {
		if (!profileData) return false;
		return profileData.role === USER_ROLES.SUPER_ADMIN || profileData.role === USER_ROLES.ADMIN;
	};

	return {
		canEdit,
		canDelete,
		canCreate,
	};
};
