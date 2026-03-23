import type { Material, WarehouseMaterial } from '@shared/models';

export interface TableMaterial {
	id: number;
	name: string;
	amount: number;
	unit: string;
	created_at: string;
	updated_at: string;
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
		unit: item.material.unit,
		material: item.material,
		material_id: item.material_id,
		created_at: new Date(item.created_at).toLocaleDateString('ru-RU'),
		updated_at: new Date(item.updated_at).toLocaleDateString('ru-RU'),
	};
}
