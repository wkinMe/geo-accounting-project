// client/src/pages/warehouses/utils/mapWarehouseMaterialToTableItem.ts

import type { InventoryItemWithMaterial } from "@/services/intentoryService";

export interface TableMaterial {
	id: number;
	name: string;
	amount: number;
	unit: string;
	created_at: string;
	updated_at: string;
	material: InventoryItemWithMaterial['material'];
	material_id: number;
}

export function mapWarehouseMaterialToTableItem(item: InventoryItemWithMaterial): TableMaterial {
	return {
		id: item.material_id,
		name: item.material.name,
		amount: item.amount,
		unit: item.material.unit,
		material: item.material,
		material_id: item.material_id,
		created_at: new Date(item.created_at).toLocaleDateString('ru-RU'),
		updated_at: new Date(item.updated_at).toLocaleDateString('ru-RU'),
	};
}
