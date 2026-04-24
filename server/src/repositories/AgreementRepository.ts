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
}
