// server/src/services/WarehouseHistoryService.ts
import { Pool } from "pg";
import { executeQuery } from "@src/utils";
import {
  WAREHOUSE_HISTORY_TYPES,
  type WarehouseHistoryType,
} from "@shared/constants/warehouseHistoryTypes";

interface CreateHistoryEntryParams {
  warehouseId: number;
  materialId: number;
  operationType: WarehouseHistoryType;
  oldAmount: number;
  newAmount: number;
  delta: number;
  userId?: number;
  agreementId?: number;
  description?: string;
}

export class WarehouseHistoryService {
  private _db: Pool;

  constructor(dbConnection: Pool) {
    this._db = dbConnection;
  }

  async createEntry(params: CreateHistoryEntryParams): Promise<void> {
    const {
      warehouseId,
      materialId,
      operationType,
      oldAmount,
      newAmount,
      delta,
      userId,
      agreementId,
      description,
    } = params;

    await executeQuery(
      this._db,
      "createWarehouseHistoryEntry",
      `
        INSERT INTO warehouse_material_history (
          warehouse_id, material_id, operation_type,
          old_amount, new_amount, delta,
          user_id, agreement_id, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        warehouseId,
        materialId,
        operationType,
        oldAmount,
        newAmount,
        delta,
        userId || null,
        agreementId || null,
        description || null,
      ],
    );
  }

  async getHistoryByWarehouse(
    warehouseId: number,
    limit: number = 100,
    offset: number = 0,
  ): Promise<any[]> {
    const rows = await executeQuery(
      this._db,
      "getHistoryByWarehouse",
      `
        SELECT 
          h.id,
          h.warehouse_id,
          h.material_id,
          h.operation_type,
          h.old_amount,
          h.new_amount,
          h.delta,
          h.user_id,
          h.agreement_id,
          h.description,
          h.created_at,
          m.name as material_name,
          m.unit as material_unit,
          u.name as user_name,
          a.id as agreement_id
        FROM warehouse_material_history h
        LEFT JOIN materials m ON h.material_id = m.id
        LEFT JOIN app_users u ON h.user_id = u.id
        LEFT JOIN agreements a ON h.agreement_id = a.id
        WHERE h.warehouse_id = $1
        ORDER BY h.created_at DESC
        LIMIT $2 OFFSET $3
      `,
      [warehouseId, limit, offset],
    );
    return rows;
  }

  async getHistoryByAgreement(
    agreementId: number,
    limit: number = 100,
    offset: number = 0,
  ): Promise<any[]> {
    const rows = await executeQuery(
      this._db,
      "getHistoryByAgreement",
      `
        SELECT 
          h.id,
          h.warehouse_id,
          h.material_id,
          h.operation_type,
          h.old_amount,
          h.new_amount,
          h.delta,
          h.user_id,
          h.agreement_id,
          h.description,
          h.created_at,
          m.name as material_name,
          m.unit as material_unit,
          w.name as warehouse_name
        FROM warehouse_material_history h
        LEFT JOIN materials m ON h.material_id = m.id
        LEFT JOIN warehouses w ON h.warehouse_id = w.id
        WHERE h.agreement_id = $1
        ORDER BY h.created_at DESC
        LIMIT $2 OFFSET $3
      `,
      [agreementId, limit, offset],
    );
    return rows;
  }
}
