// repositories/MaterialRepository.ts
import { Pool } from "pg";
import { Material } from "../domain/entities/Material";
import { DatabaseError, NotFoundError } from "@shared/service";

export class MaterialRepository {
  constructor(private db: Pool) {}

  async findAll(): Promise<Material[]> {
    const query = `
      SELECT 
        m.*,
        EXISTS(SELECT 1 FROM materials_images mi WHERE mi.material_id = m.id) as has_image
      FROM materials m 
      ORDER BY m.id
    `;

    const result = await this.db.query(query);

    return result.rows.map(
      (row) =>
        new Material(
          row.id,
          row.name,
          row.unit,
          row.created_at,
          row.updated_at,
          row.has_image,
        ),
    );
  }

  async findById(id: number): Promise<Material | null> {
    const query = `
      SELECT 
        m.*,
        EXISTS(SELECT 1 FROM materials_images mi WHERE mi.material_id = m.id) as has_image
      FROM materials m 
      WHERE m.id = $1
    `;

    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new Material(
      row.id,
      row.name,
      row.unit,
      row.created_at,
      row.updated_at,
      row.has_image,
    );
  }

  async findByName(name: string, excludeId?: number): Promise<Material | null> {
    let query = `
      SELECT 
        m.*,
        EXISTS(SELECT 1 FROM materials_images mi WHERE mi.material_id = m.id) as has_image
      FROM materials m 
      WHERE LOWER(m.name) = LOWER($1)
    `;

    const params: any[] = [name];

    if (excludeId) {
      query += ` AND m.id != $2`;
      params.push(excludeId);
    }

    const result = await this.db.query(query, params);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new Material(
      row.id,
      row.name,
      row.unit,
      row.created_at,
      row.updated_at,
      row.has_image,
    );
  }

  async save(material: Material): Promise<Material> {
    const query = `
      INSERT INTO materials (name, unit) 
      VALUES ($1, $2) 
      RETURNING id, created_at, updated_at
    `;

    const result = await this.db.query(query, [material.name, material.unit]);

    if (result.rows.length === 0) {
      throw new DatabaseError(
        "Failed to create material",
        "save",
        "MaterialRepository",
      );
    }

    return new Material(
      result.rows[0].id,
      material.name,
      material.unit,
      result.rows[0].created_at,
      result.rows[0].updated_at,
      material.hasImage,
    );
  }

  async update(id: number, material: Material): Promise<Material> {
    const query = `
      UPDATE materials 
      SET name = $1, unit = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING updated_at
    `;

    const result = await this.db.query(query, [
      material.name,
      material.unit,
      id,
    ]);

    if (result.rows.length === 0) {
      throw new NotFoundError(
        `Material with ID ${id} not found`,
        "Material",
        id.toString(),
      );
    }

    return new Material(
      id,
      material.name,
      material.unit,
      material.createdAt,
      result.rows[0].updated_at,
      material.hasImage,
    );
  }

  async delete(id: number): Promise<void> {
    // Проверяем использование в договорах
    const usageCheck = await this.db.query(
      "SELECT COUNT(*) as count FROM agreement_material WHERE material_id = $1",
      [id],
    );

    if (usageCheck.rows[0].count > 0) {
      throw new Error(
        `Material with id ${id} is used in agreements and cannot be deleted`,
      );
    }

    const query = "DELETE FROM materials WHERE id = $1 RETURNING id";
    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError(
        `Material with ID ${id} not found`,
        "Material",
        id.toString(),
      );
    }
  }

  async search(query: string, limit: number = 50): Promise<Material[]> {
    const sql = `
      SELECT 
        m.*,
        EXISTS(SELECT 1 FROM materials_images mi WHERE mi.material_id = m.id) as has_image
      FROM materials m 
      WHERE m.name ILIKE $1 OR m.unit ILIKE $1
      ORDER BY 
        CASE 
          WHEN m.name ILIKE $2 THEN 1
          WHEN m.name ILIKE $3 THEN 2
          ELSE 3
        END,
        m.name
      LIMIT $4
    `;

    const searchPattern = `%${query}%`;
    const exactStartPattern = `${query}%`;

    const result = await this.db.query(sql, [
      searchPattern,
      exactStartPattern,
      searchPattern,
      limit,
    ]);

    return result.rows.map(
      (row) =>
        new Material(
          row.id,
          row.name,
          row.unit,
          row.created_at,
          row.updated_at,
          row.has_image,
        ),
    );
  }
}
