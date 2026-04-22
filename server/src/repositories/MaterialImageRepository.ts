// repositories/MaterialImageRepository.ts
import { Pool } from "pg";
import { NotFoundError } from "@shared/service";

export class MaterialImageRepository {
  constructor(private db: Pool) {}

  async getImage(materialId: number): Promise<Buffer | null> {
    const query = "SELECT image FROM materials_images WHERE material_id = $1";
    const result = await this.db.query(query, [materialId]);

    return result.rows[0]?.image || null;
  }

  async upsertImage(materialId: number, imageData: Buffer): Promise<void> {
    const materialExists = await this.db.query(
      "SELECT id FROM materials WHERE id = $1",
      [materialId],
    );

    if (materialExists.rows.length === 0) {
      throw new NotFoundError(
        `Material with ID ${materialId} not found`,
        "Material",
        materialId.toString(),
      );
    }

    const query = `
      INSERT INTO materials_images (material_id, image) 
      VALUES ($1, $2) 
      ON CONFLICT (material_id) 
      DO UPDATE SET image = $2
    `;

    await this.db.query(query, [materialId, imageData]);
  }

  async deleteImage(materialId: number): Promise<void> {
    const query = "DELETE FROM materials_images WHERE material_id = $1";
    await this.db.query(query, [materialId]);
  }

  async imageExists(materialId: number): Promise<boolean> {
    const query =
      "SELECT material_id FROM materials_images WHERE material_id = $1";
    const result = await this.db.query(query, [materialId]);
    return result.rows.length > 0;
  }
}
