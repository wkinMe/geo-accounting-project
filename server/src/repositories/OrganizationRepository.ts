// repositories/OrganizationRepository.ts
import { Pool } from "pg";
import { Organization } from "../domain/entities/Organization";
import { DatabaseError, NotFoundError } from "@shared/service";
import { USER_ROLES } from "@shared/constants";

// Допустимые поля для сортировки
const ALLOWED_SORT_FIELDS = ["id", "name", "created_at", "updated_at"];

export class OrganizationRepository {
  constructor(private db: Pool) {}

  async findAll(
    limit: number = 50,
    offset: number = 0,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<{ data: Organization[]; total: number }> {
    const sortField =
      sortBy && ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "id";
    const order = sortOrder === "DESC" ? "DESC" : "ASC";

    const query = `
      SELECT * FROM organizations 
      ORDER BY ${sortField} ${order}
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `SELECT COUNT(*) as total FROM organizations`;

    const [dataResult, countResult] = await Promise.all([
      this.db.query(query, [limit, offset]),
      this.db.query(countQuery),
    ]);

    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    const data = dataResult.rows.map(
      (row) =>
        new Organization(
          row.id,
          row.name,
          row.created_at,
          row.updated_at,
          row.latitude,
          row.longitude,
        ),
    );

    return { data, total };
  }

  async findById(id: number): Promise<Organization | null> {
    const query = "SELECT * FROM organizations WHERE id = $1";
    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new Organization(
      row.id,
      row.name,
      row.created_at,
      row.updated_at,
      row.latitude,
      row.longitude,
    );
  }

  async findByName(
    name: string,
    excludeId?: number,
  ): Promise<Organization | null> {
    let query = "SELECT * FROM organizations WHERE LOWER(name) = LOWER($1)";
    const params: any[] = [name];

    if (excludeId) {
      query += " AND id != $2";
      params.push(excludeId);
    }

    const result = await this.db.query(query, params);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new Organization(
      row.id,
      row.name,
      row.created_at,
      row.updated_at,
      row.latitude,
      row.longitude,
    );
  }

  async save(organization: Organization): Promise<Organization> {
    const query = `
      INSERT INTO organizations (name, latitude, longitude) 
      VALUES ($1, $2, $3) 
      RETURNING id, created_at, updated_at
    `;

    const result = await this.db.query(query, [
      organization.name,
      organization.latitude,
      organization.longitude,
    ]);

    if (result.rows.length === 0) {
      throw new DatabaseError(
        "Не удалось создать организацию",
        "save",
        "OrganizationRepository",
      );
    }

    return new Organization(
      result.rows[0].id,
      organization.name,
      result.rows[0].created_at,
      result.rows[0].updated_at,
      organization.latitude,
      organization.longitude,
    );
  }

  async update(id: number, organization: Organization): Promise<Organization> {
    const query = `
      UPDATE organizations 
      SET name = $1, latitude = $2, longitude = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING updated_at
    `;

    const result = await this.db.query(query, [
      organization.name,
      organization.latitude,
      organization.longitude,
      id,
    ]);

    if (result.rows.length === 0) {
      throw new NotFoundError(
        `Организация с ID ${id} не найдена`,
        "Organization",
        id.toString(),
      );
    }

    return new Organization(
      id,
      organization.name,
      organization.created_at,
      result.rows[0].updated_at,
      organization.latitude,
      organization.longitude,
    );
  }

  async delete(id: number): Promise<void> {
    const query = "DELETE FROM organizations WHERE id = $1 RETURNING id";
    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError(
        `Организация с ID ${id} не найдена`,
        "Organization",
        id.toString(),
      );
    }
  }

  async search(
    queryStr: string,
    limit: number = 50,
    offset: number = 0,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<{ data: Organization[]; total: number }> {
    const sortField =
      sortBy && ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "name";
    const order = sortOrder === "DESC" ? "DESC" : "ASC";

    const searchPattern = `%${queryStr}%`;
    const exactStartPattern = `${queryStr}%`;

    const query = `
      SELECT * FROM organizations 
      WHERE name ILIKE $1
      ORDER BY 
        CASE 
          WHEN name ILIKE $2 THEN 1
          ELSE 2
        END,
        ${sortField} ${order}
      LIMIT $3 OFFSET $4
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM organizations 
      WHERE name ILIKE $1
    `;

    const [dataResult, countResult] = await Promise.all([
      this.db.query(query, [searchPattern, exactStartPattern, limit, offset]),
      this.db.query(countQuery, [searchPattern]),
    ]);

    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    const data = dataResult.rows.map(
      (row) =>
        new Organization(
          row.id,
          row.name,
          row.created_at,
          row.updated_at,
          row.latitude,
          row.longitude,
        ),
    );

    return { data, total };
  }

  async getSuperAdminCount(organizationId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM app_users
      WHERE organization_id = $1 AND role = $2
    `;
    const result = await this.db.query(query, [
      organizationId,
      USER_ROLES.SUPER_ADMIN,
    ]);
    return parseInt(result.rows[0]?.count || "0", 10);
  }

  async hasSuperAdmin(organizationId: number): Promise<boolean> {
    const count = await this.getSuperAdminCount(organizationId);
    return count > 0;
  }
}
