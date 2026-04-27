// repositories/WarehouseRepository.ts
import { Pool } from "pg";
import { Warehouse } from "../domain/entities/Warehouse";
import { DatabaseError, NotFoundError } from "@shared/service";
import { Organization } from "../domain/entities/Organization";
import { User } from "../domain/entities/User";
import { WarehouseWithManagerAndOrganization } from "@shared/models";

export class WarehouseRepository {
  constructor(private db: Pool) {}

  async findAll(organization_id?: number): Promise<Warehouse[]> {
    let query = "SELECT * FROM warehouses";
    const params: any[] = [];

    if (organization_id) {
      query += " WHERE organization_id = $1";
      params.push(organization_id);
    }

    query += " ORDER BY id";

    const result = await this.db.query(query, params);

    return result.rows.map(
      (row) =>
        new Warehouse(
          row.id,
          row.name,
          row.organization_id,
          row.manager_id,
          row.latitude,
          row.longitude,
          row.created_at,
          row.updated_at,
        ),
    );
  }

  async findAllWithDetails(
    organization_id?: number,
  ): Promise<WarehouseWithManagerAndOrganization[]> {
    let query = `
      SELECT 
        w.*,
        row_to_json(o.*) as organization,
        row_to_json(u.*) as manager
      FROM warehouses w
      INNER JOIN organizations o ON w.organization_id = o.id
      LEFT JOIN app_users u ON w.manager_id = u.id
    `;
    const params: any[] = [];

    if (organization_id) {
      query += " WHERE w.organization_id = $1";
      params.push(organization_id);
    }

    query += " ORDER BY w.id";
    const result = await this.db.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      organization_id: row.organization_id,
      manager_id: row.manager_id,
      latitude: row.latitude,
      longitude: row.longitude,
      created_at: row.created_at,
      updated_at: row.updated_at,
      location: [row.latitude, row.longitude],
      organization: row.organization,
      manager: row.manager,
    }));
  }

  async findById(id: number): Promise<Warehouse | null> {
    const query = "SELECT * FROM warehouses WHERE id = $1";
    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new Warehouse(
      row.id,
      row.name,
      row.organization_id,
      row.manager_id,
      row.latitude,
      row.longitude,
      row.created_at,
      row.updated_at,
    );
  }

  async findByName(
    name: string,
    organization_id: number,
    excludeId?: number,
  ): Promise<Warehouse | null> {
    let query =
      "SELECT * FROM warehouses WHERE LOWER(name) = LOWER($1) AND organization_id = $2";
    const params: any[] = [name, organization_id];

    if (excludeId) {
      query += " AND id != $3";
      params.push(excludeId);
    }

    const result = await this.db.query(query, params);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new Warehouse(
      row.id,
      row.name,
      row.organization_id,
      row.manager_id,
      row.latitude,
      row.longitude,
      row.created_at,
      row.updated_at,
    );
  }

  async findByManagerId(manager_id: number): Promise<Warehouse[]> {
    const query = "SELECT * FROM warehouses WHERE manager_id = $1 ORDER BY id";
    const result = await this.db.query(query, [manager_id]);

    return result.rows.map(
      (row) =>
        new Warehouse(
          row.id,
          row.name,
          row.organization_id,
          row.manager_id,
          row.latitude,
          row.longitude,
          row.created_at,
          row.updated_at,
        ),
    );
  }

  async save(warehouse: Warehouse): Promise<Warehouse> {
    const query = `
      INSERT INTO warehouses (name, organization_id, manager_id, latitude, longitude) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, created_at, updated_at
    `;

    const result = await this.db.query(query, [
      warehouse.name,
      warehouse.organization_id,
      warehouse.manager_id,
      warehouse.latitude,
      warehouse.longitude,
    ]);

    if (result.rows.length === 0) {
      throw new DatabaseError(
        "Не удалось создать склад",
        "save",
        "WarehouseRepository",
      );
    }

    return new Warehouse(
      result.rows[0].id,
      warehouse.name,
      warehouse.organization_id,
      warehouse.manager_id,
      warehouse.latitude,
      warehouse.longitude,
      result.rows[0].created_at,
      result.rows[0].updated_at,
    );
  }

  async update(id: number, warehouse: Warehouse): Promise<Warehouse> {
    const query = `
      UPDATE warehouses 
      SET name = $1, manager_id = $2, latitude = $3, longitude = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING updated_at
    `;

    const result = await this.db.query(query, [
      warehouse.name,
      warehouse.manager_id,
      warehouse.latitude,
      warehouse.longitude,
      id,
    ]);

    if (result.rows.length === 0) {
      throw new NotFoundError(
        `Склад с ID ${id} не найден`,
        "Warehouse",
        id.toString(),
      );
    }

    return new Warehouse(
      id,
      warehouse.name,
      warehouse.organization_id,
      warehouse.manager_id,
      warehouse.latitude,
      warehouse.longitude,
      warehouse.created_at,
      result.rows[0].updated_at,
    );
  }

  async delete(id: number): Promise<void> {
    const query = "DELETE FROM warehouses WHERE id = $1 RETURNING id";
    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError(
        `Склад с ID ${id} не найден`,
        "Warehouse",
        id.toString(),
      );
    }
  }

  async checkUsageInAgreements(
    id: number,
  ): Promise<{ as_supplier: number; as_customer: number }> {
    const supplierCheck = await this.db.query(
      "SELECT COUNT(*) as count FROM agreements WHERE supplier_warehouse_id = $1",
      [id],
    );
    const customerCheck = await this.db.query(
      "SELECT COUNT(*) as count FROM agreements WHERE customer_warehouse_id = $1",
      [id],
    );

    return {
      as_supplier: parseInt(supplierCheck.rows[0]?.count || "0", 10),
      as_customer: parseInt(customerCheck.rows[0]?.count || "0", 10),
    };
  }

  async checkHasMaterials(id: number): Promise<boolean> {
    const result = await this.db.query(
      "SELECT COUNT(*) as count FROM warehouse_material WHERE warehouse_id = $1",
      [id],
    );
    return parseInt(result.rows[0]?.count || "0", 10) > 0;
  }

  // repositories/WarehouseRepository.ts (добавить метод)
  async search(
    queryStr: string,
    organization_id?: number,
    limit: number = 50,
  ): Promise<Warehouse[]> {
    let query = `
    SELECT * FROM warehouses 
    WHERE name ILIKE $1
  `;
    const params: any[] = [`%${queryStr}%`];
    let paramIndex = 2;

    if (organization_id) {
      query += ` AND organization_id = $${paramIndex}`;
      params.push(organization_id);
      paramIndex++;
    }

    query += `
    ORDER BY 
      CASE 
        WHEN name ILIKE $${paramIndex} THEN 1
        ELSE 2
      END,
      name
    LIMIT $${paramIndex + 1}
  `;
    params.push(`${queryStr}%`, limit);

    const result = await this.db.query(query, params);

    return result.rows.map(
      (row) =>
        new Warehouse(
          row.id,
          row.name,
          row.organization_id,
          row.manager_id,
          row.latitude,
          row.longitude,
          row.created_at,
          row.updated_at,
        ),
    );
  }
}
