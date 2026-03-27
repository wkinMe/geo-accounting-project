import { BaseModel } from "./Base";

export interface Material extends BaseModel {
  name: string;
  unit: string;
}

// Промежуточная таблица warehouses и materials
export interface WarehouseMaterial {
  warehouse_id: number;
  material_id: number;
  unit: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

// Промежуточная таблица agreements и materials
export interface AgreementMaterial {
  agreement_id: number;
  material_id: number;
  amount: number;
}

