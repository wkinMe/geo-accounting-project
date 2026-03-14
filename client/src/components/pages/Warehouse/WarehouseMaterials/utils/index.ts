import type { Material, WarehouseMaterial } from '@shared/models';

export interface TableMaterial {
	id: number;
	name: string;
	amount: number;
	material: Material;
	material_id: number;
}

export function mapWarehouseMaterialToTableItem(
	item: WarehouseMaterial & { material: Material }
): TableMaterial {
	return {
		id: item.material_id,
		name: item.material.name,
		amount: item.amount,
		material: item.material,
		material_id: item.material_id,
	};
}
