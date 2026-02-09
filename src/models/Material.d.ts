import { BaseModel } from "./Base";

export interface Material extends BaseModel {
  name: string;
}

// Промежуточная таблица warehouses и materials
export interface WarehouseMaterial {
  warehouse_id: number;
  material_id: number;
  amount: number;
}

// Промежуточная таблица agreements и materials
export interface AgreementMaterial {
  agreement_id: number;
  material_id: number;
  amount: number;
}

