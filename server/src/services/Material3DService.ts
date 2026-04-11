import { Material3D } from "@shared/models";
import { DatabaseError, Pool } from "pg";
import { executeQuery, getSingleResult } from "../utils";
import {
  CreateMaterial3DObjectDTO,
  UpdateMaterial3DObjectDTO,
} from "@shared/dto";
import { NotFoundError, ServiceError, ValidationError } from "@shared/service";

export class Material3DService {
  private _dbConnection: Pool;
  private _entityName = "materials_3d";

  constructor(dbConnection) {
    this._dbConnection = dbConnection;
  }

  async findById(id: number): Promise<Material3D> {
    try {
      const result = getSingleResult<Material3D>(
        this._dbConnection,
        `select`,
        `SELECT * FROM ${this._entityName} WHERE id=$1`,
        [id],
        `material_3d`,
      );

      return result;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to thrieve material 3d object with id=${id}`,
        `Material3DService`,
        `findById`,
        error,
      );
    }
  }

  async findByMaterialId(id: number): Promise<Material3D> {
    try {
      const result = getSingleResult<Material3D>(
        this._dbConnection,
        `select`,
        `SELECT * FROM ${this._entityName} WHERE material_id=$1`,
        [id],
      );

      return result;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }

      throw new ServiceError(
        `Filed to retrieve 3d object of material with id=${id}`,
        `Material3DService`,
        `findByMaterialId`,
        error,
      );
    }
  }

  async create({ material_id, format, model_data }: CreateMaterial3DObjectDTO) {
    try {
      if (!material_id) {
        throw new ValidationError(
          `Material ID is required`,
          `create`,
          `Material3DService`,
          `material_id`,
          material_id,
        );
      }

      if (!format) {
        throw new ValidationError(
          `File format is required`,
          `create`,
          `Material3DService`,
          `format`,
          format,
        );
      }

      if (!model_data) {
        throw new ValidationError(
          `Model data is required`,
          `create`,
          `Material3DService`,
          `model_data`,
          model_data,
        );
      }

      const existing3DObject = getSingleResult(
        this._dbConnection,
        `create`,
        `SELECT id FROM ${this._entityName} WHERE material_id=$1`,
        [material_id],
        this._entityName,
        material_id,
      );

      if (existing3DObject) {
        throw new ValidationError(
          `Object to this material already exist`,
          `create`,
          `Material3DService`,
          `material_id`,
          material_id,
        );
      }

      const rows = await executeQuery(
        this._dbConnection,
        `create`,
        `INSERT INTO ${this._entityName} VALUES ($1, $2, $3) RETURNING *`,
        [material_id, format, model_data],
      );

      if (!rows.length) {
        throw new ServiceError(
          `Failed to create 3D object - no data returned`,
          `Material3DService`,
          `create`,
        );
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
        `Failed to create 3d object`,
        `Material3DService`,
        `create`,
        error,
      );
    }
  }

  async update({ material_id, format, model_data }: UpdateMaterial3DObjectDTO) {
    try {
      if (!material_id) {
        throw new ValidationError(
          `Material ID is required`,
          `update`,
          `Material3DService`,
          `material_id`,
          material_id,
        );
      }

      if (!format) {
        throw new ValidationError(
          `File format is required`,
          `update`,
          `Material3DService`,
          `format`,
          format,
        );
      }

      if (!model_data) {
        throw new ValidationError(
          `Model data is required`,
          `update`,
          `Material3DService`,
          `model_data`,
          model_data,
        );
      }

      const existing3DObject = getSingleResult(
        this._dbConnection,
        `update`,
        `SELECT id FROM ${this._entityName} WHERE material_id=$1`,
        [material_id],
        this._entityName,
        material_id,
      );

      if (existing3DObject) {
        throw new ValidationError(
          `Object to this material already exist`,
          `update`,
          `Material3DService`,
          `material_id`,
          material_id,
        );
      }

      const rows = await executeQuery(
        this._dbConnection,
        `update`,
        `UPDATE ${this._entityName} SET format=$1, model_data=$2 WHERE material_id=$3 RETURNING *`,
        [format, model_data, material_id],
      );

      if (!rows.length) {
        throw new ServiceError(
          `Failed to update 3D object - no data returned`,
          `Material3DService`,
          `update`,
        );
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
        `Failed to update 3d object`,
        `Material3DService`,
        `update`,
        error,
      );
    }
  }
}
