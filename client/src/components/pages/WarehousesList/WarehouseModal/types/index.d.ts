export type WarehouseModalData = {
	id: number;
	name: string;
	organization_id: number;
	manager_id?: number | null;
	latitude?: number | undefined;
	longitude?: number | undefined;
} | null; // null = режим создания
