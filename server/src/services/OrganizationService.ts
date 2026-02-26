import { Pool } from "pg";
import { Organization } from "@src/models";
import { CreateOrganizationDTO, UpdateOrganizationDTO } from "@shared/dto";
import Fuse, { IFuseOptions } from "fuse.js";
import {
  DatabaseError,
  NotFoundError,
  ServiceError,
  ValidationError,
} from "@src/errors/service";
import { executeQuery, getSingleResult } from "@src/utils";

export class OrganizationService {
  private _db: Pool;

  constructor(dbConnection: Pool) {
    this._db = dbConnection;
  }

  async findAll(): Promise<Organization[]> {
    try {
      const rows = await executeQuery<Organization>(
        this._db,
        "findAll",
        `SELECT * FROM organizations ORDER BY id`,
      );
      return rows;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to retrieve organizations",
        "OrganizationService",
        "findAll",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async findById(id: number): Promise<Organization> {
    try {
      const organization = await getSingleResult<Organization>(
        this._db,
        "findById",
        `SELECT * FROM organizations WHERE id=$1`,
        [id],
        "Organization",
        id,
      );
      return organization;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to find organization with id ${id}`,
        "OrganizationService",
        "findById",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async update({
    id,
    name,
    latitude,
    longitude,
  }: UpdateOrganizationDTO): Promise<Organization> {
    try {
      // Проверяем существование организации
      await this.findById(id);

      // Валидация входных данных
      if (name !== undefined && (!name || name.trim().length === 0)) {
        throw new ValidationError(
          "Organization name cannot be empty",
          "update",
          "name",
          name,
        );
      }

      // Валидация координат
      if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
        throw new ValidationError(
          "Latitude must be between -90 and 90",
          "update",
          "latitude",
          latitude.toString(),
        );
      }

      if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
        throw new ValidationError(
          "Longitude must be between -180 and 180",
          "update",
          "longitude",
          longitude.toString(),
        );
      }

      // Проверка уникальности имени, если оно меняется
      if (name !== undefined && name.trim().length > 0) {
        const existingOrgs = await executeQuery<Organization>(
          this._db,
          "checkUniqueNameUpdate",
          "SELECT * FROM organizations WHERE LOWER(name) = LOWER($1) AND id != $2",
          [name.trim(), id],
        );

        if (existingOrgs.length > 0) {
          throw new ValidationError(
            `Organization with name "${name}" already exists`,
            "update",
            "name",
            name,
          );
        }
      }

      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        fields.push(`name = $${paramIndex}`);
        values.push(name.trim());
        paramIndex++;
      }

      if (latitude !== undefined) {
        fields.push(`latitude = $${paramIndex}`);
        values.push(latitude);
        paramIndex++;
      }

      if (longitude !== undefined) {
        fields.push(`longitude = $${paramIndex}`);
        values.push(longitude);
        paramIndex++;
      }

      // Если нет полей для обновления, возвращаем существующую организацию
      if (fields.length === 0) {
        return await this.findById(id);
      }

      values.push(id);
      const query = `
        UPDATE organizations 
        SET ${fields.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const rows = await executeQuery<Organization>(
        this._db,
        "update",
        query,
        values,
      );

      if (rows.length === 0) {
        throw new ServiceError(
          `Failed to update organization with id ${id} - no data returned`,
          "OrganizationService",
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
        `Failed to update organization with id ${id}`,
        "OrganizationService",
        "update",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async create({
    name,
    latitude,
    longitude,
  }: CreateOrganizationDTO): Promise<Organization> {
    try {
      // Валидация обязательных полей
      if (!name || name.trim().length === 0) {
        throw new ValidationError(
          "Organization name is required",
          "create",
          "name",
          name,
        );
      }

      // Валидация координат
      if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
        throw new ValidationError(
          "Latitude must be between -90 and 90",
          "create",
          "latitude",
          latitude.toString(),
        );
      }

      if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
        throw new ValidationError(
          "Longitude must be between -180 and 180",
          "create",
          "longitude",
          longitude.toString(),
        );
      }

      // Проверка уникальности имени
      const existingOrgs = await executeQuery<Organization>(
        this._db,
        "checkUniqueNameCreate",
        "SELECT * FROM organizations WHERE LOWER(name) = LOWER($1)",
        [name.trim()],
      );

      if (existingOrgs.length > 0) {
        throw new ValidationError(
          `Organization with name "${name}" already exists`,
          "create",
          "name",
          name,
        );
      }

      const rows = await executeQuery<Organization>(
        this._db,
        "create",
        `INSERT INTO organizations (name, latitude, longitude) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [name.trim(), latitude || null, longitude || null],
      );

      if (rows.length === 0) {
        throw new ServiceError(
          "Failed to create organization - no data returned",
          "OrganizationService",
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
        "Failed to create organization",
        "OrganizationService",
        "create",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async delete(id: number): Promise<Organization> {
    try {
      // Проверяем существование организации
      await this.findById(id);

      const rows = await executeQuery<Organization>(
        this._db,
        "delete",
        `DELETE FROM organizations WHERE id=$1 RETURNING *`,
        [id],
      );

      if (rows.length === 0) {
        throw new ServiceError(
          `Failed to delete organization with id ${id} - no data returned`,
          "OrganizationService",
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
        `Failed to delete organization with id ${id}`,
        "OrganizationService",
        "delete",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async search(input: string): Promise<Organization[]> {
    try {
      const organizations = await this.findAll();

      const fuseOptions: IFuseOptions<Organization> = {
        keys: [{ name: "name", weight: 1 }],
        isCaseSensitive: false,
        ignoreDiacritics: true,
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
        useExtendedSearch: true,
        includeScore: true,
        findAllMatches: true,
      };

      const fuse = new Fuse(organizations, fuseOptions);
      const searchResult = fuse.search(input);

      return searchResult.map((i) => i.item);
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to search organizations",
        "OrganizationService",
        "search",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
