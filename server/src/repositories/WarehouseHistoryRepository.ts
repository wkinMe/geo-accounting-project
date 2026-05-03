import { Pool } from "pg";
import { WarehouseHistoryItem } from "../domain/entities/WarehouseHistoryItem";
import { DatabaseError } from "@shared/service";
import { Material } from "../domain/entities/Material";
import { User } from "../domain/entities/User";
import { Warehouse } from "../domain/entities/Warehouse";
import { Agreement } from "../domain/entities/Agreement";

export interface WarehouseHistoryItemWithDetails {
  id: number;
  warehouse_id: number;
  material_id: number;
  operation_type: string;
  old_amount: number;
  new_amount: number;
  delta: number;
  user_id: number | null;
  agreement_id: number | null;
  description: string | null;
  created_at: Date;
  material: Material | null;
  user: User | null;
  warehouse: Warehouse | null;
  agreement: Agreement | null;
}

export interface WarehouseHistoryResponse {
  data: WarehouseHistoryItemWithDetails[];
  total: number;
}

export class WarehouseHistoryRepository {
  constructor(private db: Pool) {}

  async findByWarehouseWithDetails(
    warehouse_id: number,
    limit: number = 100,
    offset: number = 0,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<WarehouseHistoryResponse> {
    const order = sortOrder === "ASC" ? "ASC" : "DESC";

    let orderByClause = "";

    switch (sortBy) {
      case "created_at":
        orderByClause = `h.created_at ${order}`;
        break;
      case "operation_type":
        orderByClause = `h.operation_type ${order}`;
        break;
      case "material_name":
        orderByClause = `m.name ${order}`;
        break;
      case "old_amount":
        orderByClause = `h.old_amount ${order}`;
        break;
      case "new_amount":
        orderByClause = `h.new_amount ${order}`;
        break;
      case "delta":
        orderByClause = `h.delta ${order}`;
        break;
      case "user_name":
        orderByClause = `u.name ${order}`;
        break;
      case "agreement_id":
        orderByClause = `h.agreement_id ${order}`;
        break;
      case "description":
        orderByClause = `h.description ${order}`;
        break;
      default:
        orderByClause = `h.created_at DESC`;
        break;
    }

    const query = `
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
      json_build_object(
        'id', m.id,
        'name', m.name,
        'unit', m.unit,
        'created_at', m.created_at,
        'updated_at', m.updated_at
      ) as material,
      json_build_object(
        'id', u.id,
        'name', u.name,
        'role', u.role,
        'organization_id', u.organization_id,
        'created_at', u.created_at,
        'updated_at', u.updated_at
      ) as "user",
      json_build_object(
        'id', w.id,
        'name', w.name,
        'organization_id', w.organization_id,
        'manager_id', w.manager_id,
        'latitude', w.latitude,
        'longitude', w.longitude,
        'created_at', w.created_at,
        'updated_at', w.updated_at
      ) as warehouse,
      CASE 
        WHEN a.id IS NOT NULL THEN json_build_object(
          'id', a.id,
          'supplier_id', a.supplier_id,
          'customer_id', a.customer_id,
          'supplier_warehouse_id', a.supplier_warehouse_id,
          'customer_warehouse_id', a.customer_warehouse_id,
          'status', a.status,
          'created_at', a.created_at,
          'updated_at', a.updated_at
        )
        ELSE NULL
      END as agreement
    FROM warehouse_material_history h
    LEFT JOIN materials m ON h.material_id = m.id
    LEFT JOIN app_users u ON h.user_id = u.id
    LEFT JOIN warehouses w ON h.warehouse_id = w.id
    LEFT JOIN agreements a ON h.agreement_id = a.id
    WHERE h.warehouse_id = $1
    ORDER BY ${orderByClause}
    LIMIT $2 OFFSET $3
  `;

    const countQuery = `
    SELECT COUNT(*) as total
    FROM warehouse_material_history h
    WHERE h.warehouse_id = $1
  `;

    const [dataResult, countResult] = await Promise.all([
      this.db.query(query, [warehouse_id, limit, offset]),
      this.db.query(countQuery, [warehouse_id]),
    ]);

    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    const data = dataResult.rows.map((row) => ({
      id: row.id,
      warehouse_id: row.warehouse_id,
      material_id: row.material_id,
      operation_type: row.operation_type,
      old_amount: row.old_amount,
      new_amount: row.new_amount,
      delta: row.delta,
      user_id: row.user_id,
      agreement_id: row.agreement_id,
      description: row.description,
      created_at: row.created_at,
      material: row.material,
      user: row.user,
      warehouse: row.warehouse,
      agreement: row.agreement,
    }));

    return { data, total };
  }

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

  async search(
    warehouse_id: number,
    searchQuery: string,
    limit: number = 100,
    offset: number = 0,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<WarehouseHistoryResponse> {
    const order = sortOrder === "ASC" ? "ASC" : "DESC";
    const searchPattern = `%${searchQuery}%`;
    const exactStartPattern = `${searchQuery}%`;

    let orderByClause = "";

    switch (sortBy) {
      case "created_at":
        orderByClause = `h.created_at ${order}`;
        break;
      case "operation_type":
        orderByClause = `h.operation_type ${order}`;
        break;
      case "material_name":
        orderByClause = `m.name ${order}`;
        break;
      case "old_amount":
        orderByClause = `h.old_amount ${order}`;
        break;
      case "new_amount":
        orderByClause = `h.new_amount ${order}`;
        break;
      case "delta":
        orderByClause = `h.delta ${order}`;
        break;
      case "user_name":
        orderByClause = `u.name ${order}`;
        break;
      case "agreement_id":
        orderByClause = `h.agreement_id ${order}`;
        break;
      case "description":
        orderByClause = `h.description ${order}`;
        break;
      default:
        orderByClause = `h.created_at DESC`;
        break;
    }

    const query = `
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
      json_build_object(
        'id', m.id,
        'name', m.name,
        'unit', m.unit,
        'created_at', m.created_at,
        'updated_at', m.updated_at
      ) as material,
      json_build_object(
        'id', u.id,
        'name', u.name,
        'role', u.role,
        'organization_id', u.organization_id,
        'created_at', u.created_at,
        'updated_at', u.updated_at
      ) as "user",
      json_build_object(
        'id', w.id,
        'name', w.name,
        'organization_id', w.organization_id,
        'manager_id', w.manager_id,
        'latitude', w.latitude,
        'longitude', w.longitude,
        'created_at', w.created_at,
        'updated_at', w.updated_at
      ) as warehouse,
      CASE 
        WHEN a.id IS NOT NULL THEN json_build_object(
          'id', a.id,
          'supplier_id', a.supplier_id,
          'customer_id', a.customer_id,
          'supplier_warehouse_id', a.supplier_warehouse_id,
          'customer_warehouse_id', a.customer_warehouse_id,
          'status', a.status,
          'created_at', a.created_at,
          'updated_at', a.updated_at
        )
        ELSE NULL
      END as agreement
    FROM warehouse_material_history h
    LEFT JOIN materials m ON h.material_id = m.id
    LEFT JOIN app_users u ON h.user_id = u.id
    LEFT JOIN warehouses w ON h.warehouse_id = w.id
    LEFT JOIN agreements a ON h.agreement_id = a.id
    WHERE h.warehouse_id = $1 AND (
      m.name ILIKE $2 OR
      h.agreement_id::text ILIKE $2 OR
      u.name ILIKE $2
    )
    ORDER BY 
      CASE 
        WHEN m.name ILIKE $3 THEN 1
        WHEN h.agreement_id::text ILIKE $3 THEN 2
        WHEN u.name ILIKE $3 THEN 3
        ELSE 4
      END,
      ${orderByClause}
    LIMIT $4 OFFSET $5
  `;

    const countQuery = `
    SELECT COUNT(*) as total
    FROM warehouse_material_history h
    LEFT JOIN materials m ON h.material_id = m.id
    LEFT JOIN app_users u ON h.user_id = u.id
    WHERE h.warehouse_id = $1 AND (
      m.name ILIKE $2 OR
      h.agreement_id::text ILIKE $2 OR
      u.name ILIKE $2
    )
  `;

    const [dataResult, countResult] = await Promise.all([
      this.db.query(query, [
        warehouse_id,
        searchPattern,
        exactStartPattern,
        limit,
        offset,
      ]),
      this.db.query(countQuery, [warehouse_id, searchPattern]),
    ]);

    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    const data = dataResult.rows.map((row) => ({
      id: row.id,
      warehouse_id: row.warehouse_id,
      material_id: row.material_id,
      operation_type: row.operation_type,
      old_amount: row.old_amount,
      new_amount: row.new_amount,
      delta: row.delta,
      user_id: row.user_id,
      agreement_id: row.agreement_id,
      description: row.description,
      created_at: row.created_at,
      material: row.material,
      user: row.user,
      warehouse: row.warehouse,
      agreement: row.agreement,
    }));

    return { data, total };
  }
}
