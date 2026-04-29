// shared/models/WarehouseHistory.ts
import { BaseModel } from "./Base";
import { Material } from "./Material";
import { User } from "./User";
import { Warehouse } from "./Warehouse";
import { AgreementWithDetails } from "./Agreement";
import { WarehouseHistoryType } from "../constants/warehouseHistoryTypes";

export interface WarehouseHistoryItem extends BaseModel {
  warehouse_id: number;
  material_id: number;
  operation_type: WarehouseHistoryType;
  old_amount: number;
  new_amount: number;
  delta: number;
  user_id: number | null;
  agreement_id: number | null;
  description: string | null;
}

export interface WarehouseHistoryItemWithDetails extends WarehouseHistoryItem {
  material?: Material;
  user?: User;
  agreement?: AgreementWithDetails;
  warehouse?: Warehouse;
}
