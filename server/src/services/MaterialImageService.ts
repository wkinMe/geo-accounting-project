// server/src/services/MaterialImageService.ts
import { Pool } from "pg";
import { DatabaseError, NotFoundError, ServiceError } from "@shared/service";
import { executeQuery, findSingleResult } from "@src/utils";

export class MaterialImageService {
  private _db: Pool;

  constructor(dbConnection: Pool) {
    this._db = dbConnection;
  }

  async getImageByMaterialId(materialId: number): Promise<Buffer | null> {
    try {
      const result = await findSingleResult<{ image: Buffer }>(
        this._db,
        "getImageByMaterialId",
        "SELECT image FROM materials_images WHERE material_id = $1",
        [materialId],
      );


      return result?.image || null;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to get image for material ${materialId}`,
        "MaterialImageService",
        "getImageByMaterialId",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async upsertImage(materialId: number, imageData: Buffer): Promise<void> {
    try {
      // Проверяем, существует ли материал
      const materialExists = await findSingleResult<{ id: number }>(
        this._db,
        "checkMaterialExists",
        "SELECT id FROM materials WHERE id = $1",
        [materialId],
      );

      if (!materialExists) {
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

      await executeQuery(this._db, "upsertImage", query, [
        materialId,
        imageData,
      ]);
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to upsert image for material ${materialId}`,
        "MaterialImageService",
        "upsertImage",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async deleteImage(materialId: number): Promise<void> {
    try {
      const query = `
        DELETE FROM materials_images 
        WHERE material_id = $1
      `;

      await executeQuery(this._db, "deleteImage", query, [materialId]);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to delete image for material ${materialId}`,
        "MaterialImageService",
        "deleteImage",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async imageExists(materialId: number): Promise<boolean> {
    try {
      const result = await findSingleResult<{ material_id: number }>(
        this._db,
        "imageExists",
        "SELECT material_id FROM materials_images WHERE material_id = $1",
        [materialId],
      );

      return !!result;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to check if image exists for material ${materialId}`,
        "MaterialImageService",
        "imageExists",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
