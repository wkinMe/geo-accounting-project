import { Pool } from "pg";
import { DatabaseError, NotFoundError } from "@shared/service";
import { InventoryItem as InventoryItemEntity } from "../domain/entities/InventoryItem";
import type { Material } from "@shared/models";

// Тип для ответа с материалом
export interface InventoryItemWithMaterial {
  id: number;
  warehouse_id: number;
  material_id: number;
  amount: number;
  created_at: Date;
  updated_at: Date;
  material: Material;
}

export interface InventoryResponse {
  data: InventoryItemWithMaterial[];
  total: number;
}

const ALLOWED_SORT_FIELDS = [
  "id",
  "amount",
  "material_name",
  "created_at",
  "updated_at",
];

export class InventoryRepository {
  constructor(private db: Pool) {}

  async findByWarehouseAndMaterial(
    warehouse_id: number,
    material_id: number,
  ): Promise<InventoryItemEntity | null> {
    const query = `
      SELECT id, warehouse_id, material_id, amount, created_at, updated_at
      FROM warehouse_material 
      WHERE warehouse_id = $1 AND material_id = $2
    `;
    const result = await this.db.query(query, [warehouse_id, material_id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new InventoryItemEntity(
      row.id,
      row.warehouse_id,
      row.material_id,
      row.amount,
      row.created_at,
      row.updated_at,
    );
  }

  async findByWarehouse(warehouse_id: number): Promise<InventoryItemEntity[]> {
    const query = `
      SELECT id, warehouse_id, material_id, amount, created_at, updated_at
      FROM warehouse_material 
      WHERE warehouse_id = $1
      ORDER BY material_id
    `;
    const result = await this.db.query(query, [warehouse_id]);

    return result.rows.map(
      (row) =>
        new InventoryItemEntity(
          row.id,
          row.warehouse_id,
          row.material_id,
          row.amount,
          row.created_at,
          row.updated_at,
        ),
    );
  }

  async findByMaterial(material_id: number): Promise<InventoryItemEntity[]> {
    const query = `
      SELECT id, warehouse_id, material_id, amount, created_at, updated_at
      FROM warehouse_material 
      WHERE material_id = $1
      ORDER BY warehouse_id
    `;
    const result = await this.db.query(query, [material_id]);

    return result.rows.map(
      (row) =>
        new InventoryItemEntity(
          row.id,
          row.warehouse_id,
          row.material_id,
          row.amount,
          row.created_at,
          row.updated_at,
        ),
    );
  }

  async findByWarehouseWithMaterial(
    warehouse_id: number,
    limit: number = 20,
    offset: number = 0,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<InventoryResponse> {
    const sortField =
      sortBy && ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "material_name";
    const order = sortOrder === "ASC" ? "ASC" : "DESC";

    let orderByClause = "";

    switch (sortField) {
      case "amount":
        orderByClause = `wm.amount ${order}`;
        break;
      case "created_at":
        orderByClause = `wm.created_at ${order}`;
        break;
      case "updated_at":
        orderByClause = `wm.updated_at ${order}`;
        break;
      case "material_name":
      default:
        orderByClause = `m.name ${order}`;
        break;
    }

    const query = `
    SELECT 
      wm.id,
      wm.warehouse_id,
      wm.material_id,
      wm.amount,
      wm.created_at,
      wm.updated_at,
      json_build_object(
        'id', m.id,
        'name', m.name,
        'unit', m.unit,
        'created_at', m.created_at,
        'updated_at', m.updated_at
      ) as material
    FROM warehouse_material wm
    INNER JOIN materials m ON wm.material_id = m.id
    WHERE wm.warehouse_id = $1
    ORDER BY ${orderByClause}
    LIMIT $2 OFFSET $3
  `;

    const countQuery = `
    SELECT COUNT(*) as total
    FROM warehouse_material wm
    WHERE wm.warehouse_id = $1
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
      amount: row.amount,
      created_at: row.created_at,
      updated_at: row.updated_at,
      material: row.material,
    }));

    return { data, total };
  }

  async save(inventoryItem: InventoryItemEntity): Promise<InventoryItemEntity> {
    const query = `
      INSERT INTO warehouse_material (warehouse_id, material_id, amount) 
      VALUES ($1, $2, $3) 
      RETURNING id, created_at, updated_at
    `;

    const result = await this.db.query(query, [
      inventoryItem.warehouse_id,
      inventoryItem.material_id,
      inventoryItem.amount,
    ]);

    if (result.rows.length === 0) {
      throw new DatabaseError(
        "Не удалось добавить материал на склад",
        "save",
        "InventoryRepository",
      );
    }

    return new InventoryItemEntity(
      result.rows[0].id,
      inventoryItem.warehouse_id,
      inventoryItem.material_id,
      inventoryItem.amount,
      result.rows[0].created_at,
      result.rows[0].updated_at,
    );
  }

  async update(
    inventoryItem: InventoryItemEntity,
  ): Promise<InventoryItemEntity> {
    const query = `
      UPDATE warehouse_material 
      SET amount = $1, updated_at = CURRENT_TIMESTAMP
      WHERE warehouse_id = $2 AND material_id = $3
      RETURNING updated_at
    `;

    const result = await this.db.query(query, [
      inventoryItem.amount,
      inventoryItem.warehouse_id,
      inventoryItem.material_id,
    ]);

    if (result.rows.length === 0) {
      throw new NotFoundError(
        `Материал не найден на складе ${inventoryItem.warehouse_id}`,
        "InventoryItem",
        `${inventoryItem.warehouse_id},${inventoryItem.material_id}`,
      );
    }

    return new InventoryItemEntity(
      inventoryItem.id,
      inventoryItem.warehouse_id,
      inventoryItem.material_id,
      inventoryItem.amount,
      inventoryItem.created_at,
      result.rows[0].updated_at,
    );
  }

  async delete(warehouse_id: number, material_id: number): Promise<void> {
    const query =
      "DELETE FROM warehouse_material WHERE warehouse_id = $1 AND material_id = $2 RETURNING id";
    const result = await this.db.query(query, [warehouse_id, material_id]);

    if (result.rows.length === 0) {
      throw new NotFoundError(
        `Материал не найден на складе ${warehouse_id}`,
        "InventoryItem",
        `${warehouse_id},${material_id}`,
      );
    }
  }

  async getTotalAmount(material_id: number): Promise<number> {
    const query =
      "SELECT COALESCE(SUM(amount), 0) as total FROM warehouse_material WHERE material_id = $1";
    const result = await this.db.query(query, [material_id]);
    return parseFloat(result.rows[0]?.total || "0");
  }

  async findWarehouseWithMaxMaterial(
    material_id: number,
  ): Promise<{ warehouse_id: number; amount: number } | null> {
    const query = `
      SELECT warehouse_id, amount
      FROM warehouse_material
      WHERE material_id = $1
      ORDER BY amount DESC
      LIMIT 1
    `;
    const result = await this.db.query(query, [material_id]);

    if (result.rows.length === 0) return null;

    return {
      warehouse_id: result.rows[0].warehouse_id,
      amount: parseFloat(result.rows[0].amount),
    };
  }

  async findTopWarehousesByMaterial(
    material_id: number,
    limit: number = 5,
  ): Promise<{ warehouse_id: number; amount: number }[]> {
    const query = `
      SELECT warehouse_id, amount
      FROM warehouse_material
      WHERE material_id = $1
      ORDER BY amount DESC
      LIMIT $2
    `;
    const result = await this.db.query(query, [material_id, limit]);

    return result.rows.map((row) => ({
      warehouse_id: row.warehouse_id,
      amount: parseFloat(row.amount),
    }));
  }

  async getMaterialDistribution(material_id: number): Promise<{
    total_amount: number;
    warehouses_count: number;
    items: Array<{
      warehouse_id: number;
      warehouse_name: string;
      amount: number;
      percentage: number;
    }>;
  }> {
    const query = `
      WITH material_stats AS (
        SELECT 
          wm.warehouse_id,
          wm.amount,
          w.name as warehouse_name,
          SUM(wm.amount) OVER() as total_amount
        FROM warehouse_material wm
        JOIN warehouses w ON wm.warehouse_id = w.id
        WHERE wm.material_id = $1
      )
      SELECT 
        warehouse_id,
        warehouse_name,
        amount,
        total_amount,
        ROUND((amount::numeric / NULLIF(total_amount::numeric, 0)) * 100, 2) as percentage
      FROM material_stats
      ORDER BY amount DESC
    `;
    const result = await this.db.query(query, [material_id]);

    if (result.rows.length === 0) {
      return {
        total_amount: 0,
        warehouses_count: 0,
        items: [],
      };
    }

    const total_amount = parseFloat(result.rows[0].total_amount);

    return {
      total_amount,
      warehouses_count: result.rows.length,
      items: result.rows.map((row) => ({
        warehouse_id: row.warehouse_id,
        warehouse_name: row.warehouse_name,
        amount: parseFloat(row.amount),
        percentage: parseFloat(row.percentage),
      })),
    };
  }

  async searchMaterials(
    warehouse_id: number,
    searchQuery: string,
    limit: number = 20,
    offset: number = 0,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<InventoryResponse> {
    const sortField =
      sortBy && ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "m.name";
    const order = sortOrder === "ASC" ? "ASC" : "DESC";

    const query = `
    SELECT 
      wm.id,
      wm.warehouse_id,
      wm.material_id,
      wm.amount,
      wm.created_at,
      wm.updated_at,
      json_build_object(
        'id', m.id,
        'name', m.name,
        'unit', m.unit,
        'created_at', m.created_at,
        'updated_at', m.updated_at
      ) as material
    FROM warehouse_material wm
    INNER JOIN materials m ON wm.material_id = m.id
    WHERE wm.warehouse_id = $1 AND m.name ILIKE $2
    ORDER BY 
      CASE 
        WHEN $5 = 'amount' THEN wm.amount::text
        WHEN $5 = 'material_name' THEN m.name
        WHEN $5 = 'created_at' THEN wm.created_at::text
        WHEN $5 = 'updated_at' THEN wm.updated_at::text
        ELSE m.name
      END ${order}
    LIMIT $3 OFFSET $4
  `;

    const countQuery = `
    SELECT COUNT(*) as total
    FROM warehouse_material wm
    INNER JOIN materials m ON wm.material_id = m.id
    WHERE wm.warehouse_id = $1 AND m.name ILIKE $2
  `;

    const searchPattern = `%${searchQuery}%`;

    const [dataResult, countResult] = await Promise.all([
      this.db.query(query, [
        warehouse_id,
        searchPattern,
        limit,
        offset,
        sortField,
      ]),
      this.db.query(countQuery, [warehouse_id, searchPattern]),
    ]);

    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    const data = dataResult.rows.map((row) => ({
      id: row.id,
      warehouse_id: row.warehouse_id,
      material_id: row.material_id,
      amount: row.amount,
      created_at: row.created_at,
      updated_at: row.updated_at,
      material: row.material,
    }));

    return { data, total };
  }
}
