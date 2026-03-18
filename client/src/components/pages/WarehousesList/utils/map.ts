import type { WarehouseWithManagerAndOrganization } from "@shared/models";

export const mapWarehouseToTableItem = (warehouse: WarehouseWithManagerAndOrganization) => ({
	id: warehouse.id,
	name: warehouse.name,
	manager: warehouse.manager?.name || '-',
	managerId: warehouse.manager?.id,
	organization: warehouse.organization.name,
	organization_id: warehouse.organization.id,
	latitude: warehouse.latitude,
	longitude: warehouse.longitude,
	created_at: new Date(warehouse.created_at).toLocaleDateString(),
	updated_at: new Date(warehouse.updated_at).toLocaleDateString(),
});