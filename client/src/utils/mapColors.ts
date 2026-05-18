import { MARKER_COLORS } from '@/components/shared/Map';
import type { WarehouseWithManagerAndOrganization } from '@shared/models';

export const getOrganizationColor = (currentUserOrgId: number, orgId: number) => {
	return orgId === currentUserOrgId ? MARKER_COLORS.OWN_ORG : MARKER_COLORS.OTHER_ORG;
};

export const getWarehouseColor = (
	currentUserOrgId: number,
	warehouse: WarehouseWithManagerAndOrganization
) => {
	const isOwnOrg = warehouse.organization_id === currentUserOrgId;
	const hasManager = warehouse.manager_id !== null;

	if (isOwnOrg) {
		return hasManager ? MARKER_COLORS.OWN_WITH_MANAGER : MARKER_COLORS.OWN_NO_MANAGER;
	} else {
		return hasManager ? MARKER_COLORS.OTHER_WITH_MANAGER : MARKER_COLORS.OTHER_NO_MANAGER;
	}
};
