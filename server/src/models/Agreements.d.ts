// types/agreement.types.ts

import { BaseModel } from "./Base";
import { Material } from "./Material";
import { UserWithOrganization } from "./User";
import { Warehouse } from "./Warehouse";

export interface Agreement extends BaseModel {
  supplier_id: number; // поставщик (organization)
  customer_id: number; // закачик (organization)
  supplier_warehouse_id: number; // склад поставщика
  customer_warehouse_id: number; // склад закачика
  status?: string; // статус договора
}

// With типы
export interface AgreementWithDetails extends Agreement {
  supplier?: UserWithOrganization;
  customer?: UserWithOrganization;
  supplier_warehouse?: Warehouse;
  customer_warehouse?: Warehouse;
  materials: {
    material: Material,
    amount: number;
  }[]
}
