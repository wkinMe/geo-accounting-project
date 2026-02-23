import { Pool } from "pg";
import { Material } from "@src/models";
import { CreateMaterialDTO, UpdateMaterialDTO } from "@src/dto";
import Fuse, { IFuseOptions } from "fuse.js";
import {
  DatabaseError,
  NotFoundError,
  ServiceError,
  ValidationError,
} from "@src/errors/service"; // Импортируем классы ошибок
import { executeQuery, getSingleResult } from "@src/utils";

export class MaterialService {
  private _db: Pool;

  constructor(dbConnection: Pool) {
    this._db = dbConnection;
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
      if (error instanceof DatabaseError) {
        throw error;
      }
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to find material with id ${id}`,
        "MaterialService",
        "findById",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async create(value: CreateMaterialDTO): Promise<Material> {
    try {
      // Проверка на пустое имя
      if (!value.name || value.name.trim().length === 0) {
        throw new ValidationError(
          "Material name cannot be empty",
          "create",
          "name",
          value.name,
        );
      }

      // Проверка уникальности имени (опционально)
      const existingMaterials = await executeQuery<Material>(
        this._db,
        "checkUniqueName",
        "SELECT * FROM materials WHERE LOWER(name) = LOWER($1)",
        [value.name.trim()],
      );

      if (existingMaterials.length > 0) {
        throw new ValidationError(
          `Material with name "${value.name}" already exists`,
          "create",
          "name",
          value.name,
        );
      }

      const rows = await executeQuery<Material>(
        this._db,
        "create",
        "INSERT INTO materials (name) VALUES ($1) RETURNING *",
        [value.name.trim()],
      );

      if (rows.length === 0) {
        throw new ServiceError(
          "Failed to create material - no data returned",
          "MaterialService",
          "create",
          new Error("No data returned from INSERT query"),
        );
      }

      return rows[0];
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

  async update({ name, id }: UpdateMaterialDTO): Promise<Material> {
    try {
      // Проверяем существование материала
      const existingMaterial = await this.findById(id);

      // Проверка на пустое имя
      if (!name || name.trim().length === 0) {
        throw new ValidationError(
          "Material name cannot be empty",
          "update",
          "name",
          name,
        );
      }

      // Если имя изменилось, проверяем уникальность
      if (name.trim() !== existingMaterial.name) {
        const existingMaterials = await executeQuery<Material>(
          this._db,
          "checkUniqueNameUpdate",
          "SELECT * FROM materials WHERE LOWER(name) = LOWER($1) AND id != $2",
          [name.trim(), id],
        );

        if (existingMaterials.length > 0) {
          throw new ValidationError(
            `Material with name "${name}" already exists`,
            "update",
            "name",
            name,
          );
        }
      }

      const rows = await executeQuery<Material>(
        this._db,
        "update",
        `UPDATE materials SET name=$1, updated_at = CURRENT_TIMESTAMP WHERE id=$2 RETURNING *`,
        [name.trim(), id],
      );

      if (rows.length === 0) {
        throw new ServiceError(
          `Failed to update material with id ${id} - no data returned`,
          "MaterialService",
          "update",
          new Error("No data returned from UPDATE query"),
        );
      }

      return rows[0];
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
        `Failed to update material with id ${id}`,
        "MaterialService",
        "update",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async delete(id: number): Promise<Material> {
    try {
      // Проверяем существование материала перед удалением
      await this.findById(id);

      // Проверяем, используется ли материал в каких-либо соглашениях
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

      return rows[0];
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
        keys: [{ name: "name", weight: 1 }],
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
}
