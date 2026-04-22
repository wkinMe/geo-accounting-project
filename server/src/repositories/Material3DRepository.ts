// repositories/Material3DRepository.ts
import { Pool } from "pg";
import { Material3D } from "../domain/entities/Material3D";
import { DatabaseError, NotFoundError } from "@shared/service";

export class Material3DRepository {
  constructor(private db: Pool) {}

  async findByMaterialId(materialId: number): Promise<Material3D | null> {
    const query = `
      SELECT id, material_id, format, model_data, created_at, updated_at
      FROM materials_3d 
      WHERE material_id = $1
    `;

    const result = await this.db.query(query, [materialId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new Material3D(
      row.id,
      row.material_id,
      row.format,
      row.model_data,
      row.created_at,
      row.updated_at,
    );
  }

  async findById(id: number): Promise<Material3D | null> {
    const query = `
      SELECT id, material_id, format, model_data, created_at, updated_at
      FROM materials_3d 
      WHERE id = $1
    `;

    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new Material3D(
      row.id,
      row.material_id,
      row.format,
      row.model_data,
      row.created_at,
      row.updated_at,
    );
  }

  async save(material3D: Material3D): Promise<Material3D> {
    const query = `
      INSERT INTO materials_3d (material_id, format, model_data)
      VALUES ($1, $2, $3)
      RETURNING id, created_at, updated_at
    `;

    const result = await this.db.query(query, [
      material3D.materialId,
      material3D.format,
      material3D.modelData,
    ]);

    if (result.rows.length === 0) {
      throw new DatabaseError(
        "Failed to save 3D object",
        "save",
        "Material3DRepository",
      );
    }

    return new Material3D(
      result.rows[0].id,
      material3D.materialId,
      material3D.format,
      material3D.modelData,
      result.rows[0].created_at,
      result.rows[0].updated_at,
    );
  }

  async update(
    materialId: number,
    material3D: Material3D,
  ): Promise<Material3D> {
    const query = `
      UPDATE materials_3d 
      SET format = $1, model_data = $2, updated_at = CURRENT_TIMESTAMP
      WHERE material_id = $3
      RETURNING updated_at
    `;

    const result = await this.db.query(query, [
      material3D.format,
      material3D.modelData,
      materialId,
    ]);

    if (result.rows.length === 0) {
      throw new NotFoundError(
        `3D object for material ${materialId} not found`,
        "Material3D",
        "update",
        materialId,
      );
    }

    return new Material3D(
      material3D.id,
      material3D.materialId,
      material3D.format,
      material3D.modelData,
      material3D.createdAt,
      result.rows[0].updated_at,
    );
  }

  async delete(materialId: number): Promise<void> {
    const query = "DELETE FROM materials_3d WHERE material_id = $1";
    const result = await this.db.query(query, [materialId]);

    if (result.rowCount === 0) {
      throw new NotFoundError(
        `3D object for material ${materialId} not found`,
        "Material3D",
        "delete",
        materialId,
      );
    }
  }

  async exists(materialId: number): Promise<boolean> {
    const query = "SELECT id FROM materials_3d WHERE material_id = $1";
    const result = await this.db.query(query, [materialId]);
    return result.rows.length > 0;
  }
}
