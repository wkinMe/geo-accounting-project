export type WarehouseModalData = {
	id: number;
	name: string;
	organization_id: number;
	manager_id?: number | null;
	latitude?: number | null;
	longitude?: number | null;
} | null; // null = режим создания
