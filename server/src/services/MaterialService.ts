// server/src/services/MaterialService.ts
import { Pool } from "pg";
import { Material } from "@shared/models";
import { CreateMaterialDTO, UpdateMaterialDTO } from "@shared/dto";
import Fuse, { IFuseOptions } from "fuse.js";
import {
  DatabaseError,
  NotFoundError,
  ServiceError,
  ValidationError,
} from "@shared/service";
import { executeQuery, findSingleResult, getSingleResult } from "@src/utils";
import { MaterialImageService } from "./MaterialImageService";

export class MaterialService {
  private _db: Pool;
  private _materialImageService: MaterialImageService;

  constructor(dbConnection: Pool) {
    this._db = dbConnection;
    this._materialImageService = new MaterialImageService(dbConnection);
  }

  async findAll(): Promise<Material[]> {
    try {
      const rows = await executeQuery<Material>(
        this._db,
        "findAll",
        "SELECT * FROM materials ORDER BY id",
      );
      return rows;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to retrieve materials",
        "MaterialService",
        "findAll",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async findById(id: number): Promise<Material> {
    try {
      const material = await getSingleResult<Material>(
        this._db,
        "findById",
        "SELECT * FROM materials WHERE id = $1",
        [id],
        "Material",
        id,
      );
      return material;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to find material with id ${id}`,
        "MaterialService",
        "findById",
        error,
      );
    }
  }

  async create(value: CreateMaterialDTO): Promise<Material> {
    try {
      // Валидация имени
      if (!value.name || value.name.trim().length === 0) {
        throw new ValidationError(
          "Material name cannot be empty",
          "create",
          "name",
          value.name,
        );
      }

      // Валидация единицы измерения
      if (!value.unit || value.unit.trim().length === 0) {
        throw new ValidationError(
          "Material unit cannot be empty",
          "create",
          "unit",
          value.unit,
        );
      }

      // Проверка на существование материала с таким именем
      const existingMaterial = await findSingleResult<Material>(
        this._db,
        "checkUniqueName",
        "SELECT * FROM materials WHERE LOWER(name) = LOWER($1)",
        [value.name.trim()],
      );

      if (existingMaterial) {
        throw new ValidationError(
          `Material with name "${value.name}" already exists`,
          "create",
          "name",
          value.name,
        );
      }

      const client = await this._db.connect();

      try {
        await client.query("BEGIN");

        // Создаем материал
        const createMaterialQuery = `
          INSERT INTO materials (name, unit) 
          VALUES ($1, $2) 
          RETURNING *
        `;

        const materialResult = await client.query(createMaterialQuery, [
          value.name.trim(),
          value.unit.trim(),
        ]);

        if (materialResult.rows.length === 0) {
          throw new ServiceError(
            "Failed to create material - no data returned",
            "MaterialService",
            "create",
            new Error("No data returned from INSERT query"),
          );
        }

        const createdMaterial = materialResult.rows[0];

        await client.query("COMMIT");

        // Если есть изображение - upsert (создаем или обновляем)
        if (value.image && value.image.length > 0) {
          const imageBuffer =
            value.image instanceof Uint8Array
              ? Buffer.from(value.image)
              : value.image;

          await this._materialImageService.upsertImage(
            createdMaterial.id,
            imageBuffer,
          );
        }

        return createdMaterial;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof ValidationError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        "Failed to create material",
        "MaterialService",
        "create",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async update(id: number, value: UpdateMaterialDTO): Promise<Material> {
    try {
      // Валидация ID
      if (!id || id <= 0) {
        throw new ValidationError(
          "Invalid material ID",
          "update",
          "id",
          id.toString(),
        );
      }

      // Проверка существования материала
      const existingMaterial = await findSingleResult<Material>(
        this._db,
        "checkExists",
        "SELECT * FROM materials WHERE id = $1",
        [id],
      );

      if (!existingMaterial) {
        throw new NotFoundError(
          `Material with ID ${id} not found`,
          "Material",
          id.toString(),
        );
      }

      const client = await this._db.connect();

      try {
        await client.query("BEGIN");

        // Формируем динамический запрос для обновления
        const updates: string[] = [];
        const values: any[] = [];
        let paramCounter = 1;

        if (value.name !== undefined) {
          if (value.name.trim().length === 0) {
            throw new ValidationError(
              "Material name cannot be empty",
              "update",
              "name",
              value.name,
            );
          }

          // Проверка уникальности имени (если имя меняется)
          if (value.name !== existingMaterial.name) {
            const nameExists = await client.query(
              "SELECT id FROM materials WHERE LOWER(name) = LOWER($1) AND id != $2",
              [value.name.trim(), id],
            );

            if (nameExists.rows.length > 0) {
              throw new ValidationError(
                `Material with name "${value.name}" already exists`,
                "update",
                "name",
                value.name,
              );
            }
          }

          updates.push(`name = $${paramCounter++}`);
          values.push(value.name.trim());
        }

        if (value.unit !== undefined) {
          if (value.unit.trim().length === 0) {
            throw new ValidationError(
              "Material unit cannot be empty",
              "update",
              "unit",
              value.unit,
            );
          }
          updates.push(`unit = $${paramCounter++}`);
          values.push(value.unit.trim());
        }

        // Обновляем материал если есть изменения
        if (updates.length > 0) {
          values.push(id);
          const updateQuery = `
            UPDATE materials 
            SET ${updates.join(", ")} 
            WHERE id = $${paramCounter} 
            RETURNING *
          `;

          const result = await client.query(updateQuery, values);

          if (result.rows.length === 0) {
            throw new ServiceError(
              "Failed to update material",
              "MaterialService",
              "update",
              new Error("No rows returned after update"),
            );
          }
        }

        // Обработка изображения через upsert
        if (value.image !== undefined) {
          if (value.image === null) {
            // Удаляем изображение
            await this._materialImageService.deleteImage(id);
          } else if (value.image.length > 0) {
            // Обновляем или создаем изображение
            const imageBuffer =
              value.image instanceof Uint8Array
                ? Buffer.from(value.image)
                : value.image;
            await this._materialImageService.upsertImage(id, imageBuffer);
          }
        }

        await client.query("COMMIT");

        // Возвращаем обновленный материал
        return await this.findById(id);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof ValidationError ||
        error instanceof ServiceError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }
      throw new ServiceError(
        "Failed to update material",
        "MaterialService",
        "update",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async delete(id: number): Promise<Material> {
    try {
      // Проверяем существование материала
      await this.findById(id);

      // Проверяем, используется ли материал в договорах
      const usageCheck = await executeQuery<{ count: number }>(
        this._db,
        "checkUsage",
        "SELECT COUNT(*) as count FROM agreement_material WHERE material_id = $1",
        [id],
      );

      if (usageCheck[0].count > 0) {
        throw new ValidationError(
          `Cannot delete material with id ${id} because it is used in agreements`,
          "delete",
          "material_id",
          id.toString(),
        );
      }

      const client = await this._db.connect();

      try {
        await client.query("BEGIN");

        // Удаляем изображение (если есть)
        await this._materialImageService.deleteImage(id);

        // Удаляем материал
        const rows = await executeQuery<Material>(
          this._db,
          "delete",
          `DELETE FROM materials WHERE id=$1 RETURNING *`,
          [id],
        );

        if (rows.length === 0) {
          throw new ServiceError(
            `Failed to delete material with id ${id} - no data returned`,
            "MaterialService",
            "delete",
            new Error("No data returned from DELETE query"),
          );
        }

        await client.query("COMMIT");

        return rows[0];
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof NotFoundError ||
        error instanceof ValidationError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        `Failed to delete material with id ${id}`,
        "MaterialService",
        "delete",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async search(input: string): Promise<Material[]> {
    try {
      const materials = await this.findAll();

      const fuseConfig: IFuseOptions<Material> = {
        keys: [
          { name: "name", weight: 0.7 },
          { name: "unit", weight: 0.3 },
        ],
        isCaseSensitive: false,
        ignoreDiacritics: true,
        minMatchCharLength: 2,
        shouldSort: true,
        threshold: 0.4,
        useExtendedSearch: true,
        includeScore: true,
        findAllMatches: true,
      };

      const fuse = new Fuse(materials, fuseConfig);
      const searchResult = fuse.search(input);

      return searchResult.map((i) => i.item);
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to search materials",
        "MaterialService",
        "search",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  // ========== Публичные методы для работы с изображениями ==========

  async getImage(materialId: number): Promise<Buffer | null> {
    return this._materialImageService.getImageByMaterialId(materialId);
  }

  async upsertImage(materialId: number, imageData: Buffer): Promise<void> {
    await this._materialImageService.upsertImage(materialId, imageData);
  }

  async deleteImage(materialId: number): Promise<void> {
    await this._materialImageService.deleteImage(materialId);
  }

  async imageExists(materialId: number): Promise<boolean> {
    return this._materialImageService.imageExists(materialId);
  }
}
