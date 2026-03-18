import { useProfileData } from "@/hooks/useProfileData";
import type { TableWarehouse } from "../types";

export const useWarehousePermissions = () => {

	const profileData = useProfileData();

  	const canEdit = (warehouse: TableWarehouse) => {
		if (!profileData) return false;

		if (profileData.role === 'super_admin') return true;

		if (profileData.role === 'admin' && profileData.organization_id === warehouse.organization_id) {
			return true;
		}

		if (profileData.role === 'manager' && profileData.id === warehouse.managerId) {
			return true;
		}

		return false;
	};

	const canDelete = (warehouse: TableWarehouse) => {
		if (!profileData) return false;

		if (profileData.role === 'super_admin') return true;

		if (profileData.role === 'admin' && profileData.organization_id === warehouse.organization_id) {
			return true;
		}

		return false;
	};

	const canCreate = () => {
		if (!profileData) return false;
		return profileData.role === 'super_admin' || profileData.role === 'admin';
	};

  return {
    canEdit,
    canDelete,
    canCreate,
  }
}