// shared/models/InventoryItem.ts
import { BaseModel } from "./Base";
import { Material } from "./Material";

export interface InventoryItem extends BaseModel {
  warehouse_id: number;
  material_id: number;
  amount: number;
}

export type InventoryItemWithMaterial = InventoryItem & {
  material: Material;
};
