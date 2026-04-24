// repositories/WarehouseHistoryRepository.ts
import { Pool } from "pg";
import { WarehouseHistoryItem } from "../domain/entities/WarehouseHistoryItem";
import { DatabaseError } from "@shared/service";

export class WarehouseHistoryRepository {
  constructor(private db: Pool) {}

  async save(history: WarehouseHistoryItem): Promise<WarehouseHistoryItem> {
    const query = `
      INSERT INTO warehouse_material_history (
        warehouse_id, material_id, operation_type,
        old_amount, new_amount, delta,
        user_id, agreement_id, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at
    `;

    const result = await this.db.query(query, [
      history.warehouse_id,
      history.material_id,
      history.operation_type,
      history.old_amount,
      history.new_amount,
      history.delta,
      history.user_id,
      history.agreement_id,
      history.description,
    ]);

    if (result.rows.length === 0) {
      throw new DatabaseError(
        "Не удалось создать запись в истории склада",
        "save",
        "WarehouseHistoryRepository",
      );
    }

    return new WarehouseHistoryItem(
      result.rows[0].id,
      history.warehouse_id,
      history.material_id,
      history.operation_type,
      history.old_amount,
      history.new_amount,
      history.delta,
      history.user_id,
      history.agreement_id,
      history.description,
      result.rows[0].created_at,
    );
  }

  async findByWarehouse(
    warehouse_id: number,
    limit: number = 100,
    offset: number = 0,
  ): Promise<WarehouseHistoryItem[]> {
    const query = `
      SELECT 
        id, warehouse_id, material_id, operation_type,
        old_amount, new_amount, delta,
        user_id, agreement_id, description, created_at
      FROM warehouse_material_history
      WHERE warehouse_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.db.query(query, [warehouse_id, limit, offset]);

    return result.rows.map(
      (row) =>
        new WarehouseHistoryItem(
          row.id,
          row.warehouse_id,
          row.material_id,
          row.operation_type,
          row.old_amount,
          row.new_amount,
          row.delta,
          row.user_id,
          row.agreement_id,
          row.description,
          row.created_at,
        ),
    );
  }

  async findByAgreement(
    agreement_id: number,
    limit: number = 100,
    offset: number = 0,
  ): Promise<WarehouseHistoryItem[]> {
    const query = `
      SELECT 
        id, warehouse_id, material_id, operation_type,
        old_amount, new_amount, delta,
        user_id, agreement_id, description, created_at
      FROM warehouse_material_history
      WHERE agreement_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.db.query(query, [agreement_id, limit, offset]);

    return result.rows.map(
      (row) =>
        new WarehouseHistoryItem(
          row.id,
          row.warehouse_id,
          row.material_id,
          row.operation_type,
          row.old_amount,
          row.new_amount,
          row.delta,
          row.user_id,
          row.agreement_id,
          row.description,
          row.created_at,
        ),
    );
  }

  async findByMaterial(
    material_id: number,
    limit: number = 100,
    offset: number = 0,
  ): Promise<WarehouseHistoryItem[]> {
    const query = `
      SELECT 
        id, warehouse_id, material_id, operation_type,
        old_amount, new_amount, delta,
        user_id, agreement_id, description, created_at
      FROM warehouse_material_history
      WHERE material_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.db.query(query, [material_id, limit, offset]);

    return result.rows.map(
      (row) =>
        new WarehouseHistoryItem(
          row.id,
          row.warehouse_id,
          row.material_id,
          row.operation_type,
          row.old_amount,
          row.new_amount,
          row.delta,
          row.user_id,
          row.agreement_id,
          row.description,
          row.created_at,
        ),
    );
  }
}
