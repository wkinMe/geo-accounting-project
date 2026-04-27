// repositories/AgreementRepository.ts
import { Pool } from "pg";
import { Agreement } from "../domain/entities/Agreement";
import { DatabaseError, NotFoundError } from "@shared/service";
import { AgreementStatus } from "@shared/constants";

export class AgreementRepository {
  constructor(private db: Pool) {}

  async findAll(filters?: {
    user_id?: number;
    organization_id?: number;
    role?: string;
  }): Promise<Agreement[]> {
    let query = "SELECT * FROM agreements";
    const values: any[] = [];
    const conditions: string[] = [];

    if (filters?.role === "admin" && filters?.organization_id) {
      conditions.push(
        `(supplier_id IN (SELECT id FROM app_users WHERE organization_id = $${values.length + 1}) OR customer_id IN (SELECT id FROM app_users WHERE organization_id = $${values.length + 1}))`,
      );
      values.push(filters.organization_id);
    } else if (filters?.role === "manager" && filters?.user_id) {
      conditions.push(
        `(supplier_id = $${values.length + 1} OR customer_id = $${values.length + 1})`,
      );
      values.push(filters.user_id);
    } else if (filters?.role === "user") {
      conditions.push(`1=0`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY id";

    const result = await this.db.query(query, values);

    return result.rows.map(
      (row) =>
        new Agreement(
          row.id,
          row.supplier_id,
          row.customer_id,
          row.supplier_warehouse_id,
          row.customer_warehouse_id,
          row.status as AgreementStatus,
          row.created_at,
          row.updated_at,
        ),
    );
  }

  async findById(id: number): Promise<Agreement | null> {
    const query = "SELECT * FROM agreements WHERE id = $1";
    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new Agreement(
      row.id,
      row.supplier_id,
      row.customer_id,
      row.supplier_warehouse_id,
      row.customer_warehouse_id,
      row.status as AgreementStatus,
      row.created_at,
      row.updated_at,
    );
  }

  async save(agreement: Agreement): Promise<Agreement> {
    const query = `
      INSERT INTO agreements (
        supplier_id, customer_id, supplier_warehouse_id, customer_warehouse_id, status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at, updated_at
    `;

    const result = await this.db.query(query, [
      agreement.supplier_id,
      agreement.customer_id,
      agreement.supplier_warehouse_id,
      agreement.customer_warehouse_id,
      agreement.status,
    ]);

    if (result.rows.length === 0) {
      throw new DatabaseError(
        "Не удалось создать договор",
        "save",
        "AgreementRepository",
      );
    }

    return new Agreement(
      result.rows[0].id,
      agreement.supplier_id,
      agreement.customer_id,
      agreement.supplier_warehouse_id,
      agreement.customer_warehouse_id,
      agreement.status,
      result.rows[0].created_at,
      result.rows[0].updated_at,
    );
  }

  async update(id: number, agreement: Agreement): Promise<Agreement> {
    const query = `
      UPDATE agreements 
      SET supplier_id = $1, customer_id = $2, 
          supplier_warehouse_id = $3, customer_warehouse_id = $4,
          status = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING updated_at
    `;

    const result = await this.db.query(query, [
      agreement.supplier_id,
      agreement.customer_id,
      agreement.supplier_warehouse_id,
      agreement.customer_warehouse_id,
      agreement.status,
      id,
    ]);

    if (result.rows.length === 0) {
      throw new NotFoundError(
        `Договор с ID ${id} не найден`,
        "Agreement",
        id.toString(),
      );
    }

    return new Agreement(
      id,
      agreement.supplier_id,
      agreement.customer_id,
      agreement.supplier_warehouse_id,
      agreement.customer_warehouse_id,
      agreement.status,
      agreement.created_at,
      result.rows[0].updated_at,
    );
  }

  async delete(id: number): Promise<void> {
    const query = "DELETE FROM agreements WHERE id = $1 RETURNING id";
    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError(
        `Договор с ID ${id} не найден`,
        "Agreement",
        id.toString(),
      );
    }
  }

  // repositories/AgreementRepository.ts (добавить методы)
  async findAllWithDetails(filters?: {
    user_id?: number;
    organization_id?: number;
    role?: string;
  }): Promise<any[]> {
    let query = `
    SELECT 
      a.*,
      json_build_object(
        'id', s.id,
        'name', s.name,
        'role', s.role,
        'organization_id', s.organization_id,
        'created_at', s.created_at,
        'updated_at', s.updated_at,
        'organization', json_build_object(
          'id', so.id,
          'name', so.name,
          'latitude', so.latitude,
          'longitude', so.longitude,
          'created_at', so.created_at,
          'updated_at', so.updated_at
        )
      ) as supplier,
      json_build_object(
        'id', c.id,
        'name', c.name,
        'role', c.role,
        'organization_id', c.organization_id,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'organization', json_build_object(
          'id', co.id,
          'name', co.name,
          'latitude', co.latitude,
          'longitude', co.longitude,
          'created_at', co.created_at,
          'updated_at', co.updated_at
        )
      ) as customer,
      json_build_object(
        'id', sw.id,
        'name', sw.name,
        'organization_id', sw.organization_id,
        'manager_id', sw.manager_id,
        'latitude', sw.latitude,
        'longitude', sw.longitude,
        'created_at', sw.created_at,
        'updated_at', sw.updated_at
      ) as supplier_warehouse,
      json_build_object(
        'id', cw.id,
        'name', cw.name,
        'organization_id', cw.organization_id,
        'manager_id', cw.manager_id,
        'latitude', cw.latitude,
        'longitude', cw.longitude,
        'created_at', cw.created_at,
        'updated_at', cw.updated_at
      ) as customer_warehouse,
      COALESCE(
        json_agg(
          json_build_object(
            'material', json_build_object(
              'id', m.id,
              'name', m.name,
              'unit', m.unit,
              'created_at', m.created_at,
              'updated_at', m.updated_at
            ),
            'amount', am.amount,
            'item_price', am.item_price
          )
        ) FILTER (WHERE m.id IS NOT NULL),
        '[]'::json
      ) as materials
    FROM agreements a
    INNER JOIN app_users s ON a.supplier_id = s.id
    LEFT JOIN organizations so ON s.organization_id = so.id
    INNER JOIN app_users c ON a.customer_id = c.id
    LEFT JOIN organizations co ON c.organization_id = co.id
    INNER JOIN warehouses sw ON a.supplier_warehouse_id = sw.id
    INNER JOIN warehouses cw ON a.customer_warehouse_id = cw.id
    LEFT JOIN agreement_material am ON a.id = am.agreement_id
    LEFT JOIN materials m ON am.material_id = m.id
  `;
    const values: any[] = [];
    const conditions: string[] = [];

    if (filters?.role === "admin" && filters?.organization_id) {
      conditions.push(
        `(s.organization_id = $${values.length + 1} OR c.organization_id = $${values.length + 1})`,
      );
      values.push(filters.organization_id);
    } else if (filters?.role === "manager" && filters?.user_id) {
      conditions.push(
        `(a.supplier_id = $${values.length + 1} OR a.customer_id = $${values.length + 1})`,
      );
      values.push(filters.user_id);
    } else if (filters?.role === "user") {
      conditions.push(`1=0`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query +=
      " GROUP BY a.id, s.id, so.id, c.id, co.id, sw.id, cw.id ORDER BY a.id";

    const result = await this.db.query(query, values);
    return result.rows;
  }

  async findByIdWithDetails(id: number): Promise<any | null> {
    const query = `
    SELECT 
      a.*,
      json_build_object(
        'id', s.id,
        'name', s.name,
        'role', s.role,
        'organization_id', s.organization_id,
        'created_at', s.created_at,
        'updated_at', s.updated_at,
        'organization', json_build_object(
          'id', so.id,
          'name', so.name,
          'latitude', so.latitude,
          'longitude', so.longitude,
          'created_at', so.created_at,
          'updated_at', so.updated_at
        )
      ) as supplier,
      json_build_object(
        'id', c.id,
        'name', c.name,
        'role', c.role,
        'organization_id', c.organization_id,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'organization', json_build_object(
          'id', co.id,
          'name', co.name,
          'latitude', co.latitude,
          'longitude', co.longitude,
          'created_at', co.created_at,
          'updated_at', co.updated_at
        )
      ) as customer,
      json_build_object(
        'id', sw.id,
        'name', sw.name,
        'organization_id', sw.organization_id,
        'manager_id', sw.manager_id,
        'latitude', sw.latitude,
        'longitude', sw.longitude,
        'created_at', sw.created_at,
        'updated_at', sw.updated_at
      ) as supplier_warehouse,
      json_build_object(
        'id', cw.id,
        'name', cw.name,
        'organization_id', cw.organization_id,
        'manager_id', cw.manager_id,
        'latitude', cw.latitude,
        'longitude', cw.longitude,
        'created_at', cw.created_at,
        'updated_at', cw.updated_at
      ) as customer_warehouse,
      COALESCE(
        json_agg(
          json_build_object(
            'material', json_build_object(
              'id', m.id,
              'name', m.name,
              'unit', m.unit,
              'created_at', m.created_at,
              'updated_at', m.updated_at
            ),
            'amount', am.amount,
            'item_price', am.item_price
          )
        ) FILTER (WHERE m.id IS NOT NULL),
        '[]'::json
      ) as materials
    FROM agreements a
    INNER JOIN app_users s ON a.supplier_id = s.id
    LEFT JOIN organizations so ON s.organization_id = so.id
    INNER JOIN app_users c ON a.customer_id = c.id
    LEFT JOIN organizations co ON c.organization_id = co.id
    INNER JOIN warehouses sw ON a.supplier_warehouse_id = sw.id
    INNER JOIN warehouses cw ON a.customer_warehouse_id = cw.id
    LEFT JOIN agreement_material am ON a.id = am.agreement_id
    LEFT JOIN materials m ON am.material_id = m.id
    WHERE a.id = $1
    GROUP BY a.id, s.id, so.id, c.id, co.id, sw.id, cw.id
  `;
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }
}
