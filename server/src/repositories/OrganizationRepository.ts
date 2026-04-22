// repositories/OrganizationRepository.ts
import { Pool } from "pg";
import { Organization } from "../domain/entities/Organization";
import { DatabaseError, NotFoundError } from "@shared/service";

export class OrganizationRepository {
  constructor(private db: Pool) {}

  async findAll(): Promise<Organization[]> {
    const query = "SELECT * FROM organizations ORDER BY id";
    const result = await this.db.query(query);

    return result.rows.map(
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
        "Failed to create organization",
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
        `Organization with ID ${id} not found`,
        "Organization",
        id.toString(),
      );
    }

    return new Organization(
      id,
      organization.name,
      organization.createdAt,
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
        `Organization with ID ${id} not found`,
        "Organization",
        id.toString(),
      );
    }
  }

  async search(queryStr: string, limit: number = 50): Promise<Organization[]> {
    const query = `
      SELECT * FROM organizations 
      WHERE name ILIKE $1
      ORDER BY 
        CASE 
          WHEN name ILIKE $2 THEN 1
          ELSE 2
        END,
        name
      LIMIT $3
    `;

    const searchPattern = `%${queryStr}%`;
    const exactStartPattern = `${queryStr}%`;

    const result = await this.db.query(query, [
      searchPattern,
      exactStartPattern,
      limit,
    ]);

    return result.rows.map(
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
  }
}
