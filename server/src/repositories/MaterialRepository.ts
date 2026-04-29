// repositories/MaterialRepository.ts
import { Pool } from "pg";
import { Material } from "../domain/entities/Material";
import { DatabaseError, NotFoundError } from "@shared/service";

// Допустимые поля для сортировки
const ALLOWED_SORT_FIELDS = ["id", "name", "unit"];

export class MaterialRepository {
  constructor(private db: Pool) {}

  async findAll(
    limit: number = 50,
    offset: number = 0,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<{ data: Material[]; total: number }> {
    // Определяем сортировку
    const sortField =
      sortBy && ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "id";
    const order = sortOrder === "DESC" ? "DESC" : "ASC";

    // Запрос данных с пагинацией
    const query = `
      SELECT 
        m.*,
        EXISTS(SELECT 1 FROM materials_images mi WHERE mi.material_id = m.id) as has_image
      FROM materials m 
      ORDER BY ${sortField} ${order}
      LIMIT $1 OFFSET $2
    `;

    // Запрос общего количества
    const countQuery = `SELECT COUNT(*) as total FROM materials`;

    const [dataResult, countResult] = await Promise.all([
      this.db.query(query, [limit, offset]),
      this.db.query(countQuery),
    ]);

    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    const data = dataResult.rows.map(
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

    return { data, total };
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
        "Не удалось создать материал",
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
      material.has_image,
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
        `Материал с ID ${id} не найден`,
        "Material",
        id.toString(),
      );
    }

    return new Material(
      id,
      material.name,
      material.unit,
      material.created_at,
      result.rows[0].updated_at,
      material.has_image,
    );
  }

  async delete(id: number): Promise<void> {
    const usageCheck = await this.db.query(
      "SELECT COUNT(*) as count FROM agreement_material WHERE material_id = $1",
      [id],
    );

    if (usageCheck.rows[0].count > 0) {
      throw new Error(
        `Материал с ID ${id} используется в договорах и не может быть удалён`,
      );
    }

    const query = "DELETE FROM materials WHERE id = $1 RETURNING id";
    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError(
        `Материал с ID ${id} не найден`,
        "Material",
        id.toString(),
      );
    }
  }

  async search(
    queryStr: string,
    limit: number = 50,
    offset: number = 0,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC'
  ): Promise<{ data: Material[]; total: number }> {
    const sortField = sortBy && ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
    
    const searchPattern = `%${queryStr}%`;
    const exactStartPattern = `${queryStr}%`;
    
    const query = `
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
        ${sortField} ${order}
      LIMIT $4 OFFSET $5
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM materials m 
      WHERE m.name ILIKE $1 OR m.unit ILIKE $1
    `;
    
    const [dataResult, countResult] = await Promise.all([
      this.db.query(query, [searchPattern, exactStartPattern, searchPattern, limit, offset]),
      this.db.query(countQuery, [searchPattern])
    ]);
    
    const total = parseInt(countResult.rows[0]?.total || '0', 10);
    
    const data = dataResult.rows.map(
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
    
    return { data, total };
  }
}
