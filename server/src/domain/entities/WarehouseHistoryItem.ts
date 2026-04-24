// domain/entities/WarehouseHistoryItem.ts
import { WarehouseHistoryType } from "@shared/constants/warehouseHistoryTypes";

export class WarehouseHistoryItem {
  constructor(
    public readonly id: number | undefined,
    public readonly warehouse_id: number,
    public readonly material_id: number,
    public readonly operation_type: WarehouseHistoryType,
    public readonly old_amount: number,
    public readonly new_amount: number,
    public readonly delta: number,
    public readonly user_id: number | null,
    public readonly agreement_id: number | null,
    public readonly description: string | null,
    public readonly created_at: Date,
  ) {}

  static create(params: {
    warehouse_id: number;
    material_id: number;
    operation_type: WarehouseHistoryType;
    old_amount: number;
    new_amount: number;
    delta: number;
    user_id?: number | null;
    agreement_id?: number | null;
    description?: string | null;
  }): WarehouseHistoryItem {
    return new WarehouseHistoryItem(
      undefined,
      params.warehouse_id,
      params.material_id,
      params.operation_type,
      params.old_amount,
      params.new_amount,
      params.delta,
      params.user_id || null,
      params.agreement_id || null,
      params.description || null,
      new Date(),
    );
  }

  toJSON() {
    return {
      id: this.id,
      warehouse_id: this.warehouse_id,
      material_id: this.material_id,
      operation_type: this.operation_type,
      old_amount: this.old_amount,
      new_amount: this.new_amount,
      delta: this.delta,
      user_id: this.user_id,
      agreement_id: this.agreement_id,
      description: this.description,
      created_at: this.created_at,
    };
  }
}
