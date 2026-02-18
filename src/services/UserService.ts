import { Pool } from "pg";
import bcrypt from "bcrypt";
import Fuse, { IFuseOptions } from "fuse.js";

import { CreateUserDTO, UpdateUserDTO } from "@src/dto/UserDTO";
import { Organization, User, UserWithOrganization } from "@src/models";
import { executeQuery, getSingleResult } from "@src/utils";
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
  ServiceError,
} from "@src/errors/service";

export class UserService {
  private _db: Pool;

  constructor(dbConnection: Pool) {
    this._db = dbConnection;
  }

  async findAll(): Promise<UserWithOrganization[]> {
    try {
      const query = `
        SELECT 
          row_to_json(u.*) as user,
          row_to_json(o.*) as organization
        FROM app_users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        ORDER BY u.id
      `;

      const result = await executeQuery<{
        user: User;
        organization: Organization;
      }>(this._db, "findAll", query);

      return result.map((row) => ({
        ...row.user,
        organization: row.organization,
      }));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to retrieve users",
        "UserService",
        "findAll",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async findById(id: number): Promise<UserWithOrganization> {
    try {
      const query = `
        SELECT 
          row_to_json(u.*) as user,
          row_to_json(o.*) as organization
        FROM app_users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.id = $1
      `;

      const result = await getSingleResult<{
        user: User;
        organization: Organization;
      }>(this._db, "findById", query, [id], "User", id);

      return {
        ...result.user,
        organization: result.organization,
      };
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to find user with id ${id}`,
        "UserService",
        "findById",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async create({
    name,
    organization_id,
    password,
    is_admin = false,
  }: CreateUserDTO): Promise<User> {
    try {
      // Валидация входных данных
      if (!name || name.trim().length === 0) {
        throw new ValidationError(
          "User name is required",
          "create",
          "name",
          name,
        );
      }

      if (!organization_id) {
        throw new ValidationError(
          "Organization ID is required",
          "create",
          "organization_id",
          organization_id,
        );
      }

      if (!password || password.trim().length === 0) {
        throw new ValidationError(
          "Password is required",
          "create",
          "password",
          password,
        );
      }

      // Проверяем существование организации
      const orgCheckQuery = "SELECT id FROM organizations WHERE id = $1";
      const orgExists = await executeQuery<{ id: number }>(
        this._db,
        "checkOrganization",
        orgCheckQuery,
        [organization_id],
      );

      if (orgExists.length === 0) {
        throw new ValidationError(
          `Organization with id ${organization_id} does not exist`,
          "create",
          "organization_id",
          organization_id.toString(),
        );
      }

      const salt = await bcrypt.genSalt(8);
      const hashedPassword = await bcrypt.hash(password, salt);

      const createQuery = `
        INSERT INTO app_users (name, organization_id, password, is_admin) 
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const createResult = await executeQuery<User>(
        this._db,
        "create",
        createQuery,
        [name.trim(), organization_id, hashedPassword, is_admin],
      );

      if (createResult.length === 0) {
        throw new ServiceError(
          "Failed to create user - no data returned",
          "UserService",
          "create",
          new Error("No data returned from INSERT query"),
        );
      }

      return createResult[0];
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof ValidationError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        "Failed to create user",
        "UserService",
        "create",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async update({
    id,
    name,
    organization_id,
    password,
    is_admin,
  }: UpdateUserDTO): Promise<User> {
    try {
      // Проверяем существование пользователя
      await this.findById(id);

      // Валидация входных данных
      if (name !== undefined && name.trim().length === 0) {
        throw new ValidationError(
          "User name cannot be empty",
          "update",
          "name",
          name,
        );
      }

      if (organization_id !== undefined) {
        // Проверяем существование организации
        const orgCheckQuery = "SELECT id FROM organizations WHERE id = $1";
        const orgExists = await executeQuery<{ id: number }>(
          this._db,
          "checkOrganization",
          orgCheckQuery,
          [organization_id],
        );

        if (orgExists.length === 0) {
          throw new ValidationError(
            `Organization with id ${organization_id} does not exist`,
            "update",
            "organization_id",
            organization_id.toString(),
          );
        }
      }

      if (password !== undefined && password.trim().length === 0) {
        throw new ValidationError(
          "Password cannot be empty",
          "update",
          "password",
          password,
        );
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(name.trim());
        paramIndex++;
      }

      if (organization_id !== undefined) {
        updates.push(`organization_id = $${paramIndex}`);
        values.push(organization_id);
        paramIndex++;
      }

      if (password !== undefined) {
        const salt = await bcrypt.genSalt(8);
        const hashedPassword = await bcrypt.hash(password, salt);
        updates.push(`password = $${paramIndex}`);
        values.push(hashedPassword);
        paramIndex++;
      }

      if (is_admin !== undefined) {
        updates.push(`is_admin = $${paramIndex}`);
        values.push(is_admin);
        paramIndex++;
      }

      // Если нет полей для обновления, возвращаем текущего пользователя
      if (updates.length === 0) {
        return await this.findById(id);
      }

      values.push(id);
      const updateQuery = `
        UPDATE app_users 
        SET ${updates.join(", ")} 
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const updateResult = await executeQuery<User>(
        this._db,
        "update",
        updateQuery,
        values,
      );

      if (updateResult.length === 0) {
        throw new ServiceError(
          `Failed to update user with id ${id} - no data returned`,
          "UserService",
          "update",
          new Error("No data returned from UPDATE query"),
        );
      }

      return updateResult[0];
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
        `Failed to update user with id ${id}`,
        "UserService",
        "update",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async delete(id: number): Promise<User> {
    try {
      // Проверяем существование пользователя перед удалением
      await this.findById(id);

      const deleteQuery = "DELETE FROM app_users WHERE id = $1 RETURNING *";
      const deleteResult = await executeQuery<User>(
        this._db,
        "delete",
        deleteQuery,
        [id],
      );

      if (deleteResult.length === 0) {
        throw new ServiceError(
          `Failed to delete user with id ${id} - no data returned`,
          "UserService",
          "delete",
          new Error("No data returned from DELETE query"),
        );
      }

      return deleteResult[0];
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof NotFoundError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        `Failed to delete user with id ${id}`,
        "UserService",
        "delete",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async findByOrganizationId(
    organizationId: number,
  ): Promise<UserWithOrganization[]> {
    try {
      const query = `
        SELECT 
          row_to_json(u.*) as user,
          row_to_json(o.*) as organization
        FROM app_users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.organization_id = $1
        ORDER BY u.id
      `;

      const result = await executeQuery<{
        user: User;
        organization: Organization;
      }>(this._db, "findByOrganizationId", query, [organizationId]);

      return result.map((row) => ({
        ...row.user,
        organization: row.organization,
      }));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new ServiceError(
        `Failed to find users for organization ${organizationId}`,
        "UserService",
        "findByOrganizationId",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async findAdmins(): Promise<UserWithOrganization[]> {
    try {
      const query = `
        SELECT 
          row_to_json(u.*) as user,
          row_to_json(o.*) as organization
        FROM app_users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.is_admin = true
        ORDER BY u.id
      `;

      const result = await executeQuery<{
        user: User;
        organization: Organization;
      }>(this._db, "findAdmins", query);

      return result.map((row) => ({
        ...row.user,
        organization: row.organization,
      }));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to retrieve admins",
        "UserService",
        "findAdmins",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async getAvailableManagers(organizationId?: number): Promise<User[]> {
    try {
      let query = `
        SELECT u.*
        FROM app_users u
        WHERE u.is_admin = false
      `;

      const values: any[] = [];

      if (organizationId !== undefined) {
        query += " AND u.organization_id = $1";
        values.push(organizationId);
      }

      query += " ORDER BY u.name";

      const result = await executeQuery<User>(
        this._db,
        "getAvailableManagers",
        query,
        values,
      );

      return result;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to retrieve available managers",
        "UserService",
        "getAvailableManagers",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async search(input: string): Promise<UserWithOrganization[]> {
    try {
      if (!input || input.trim().length === 0) {
        throw new ValidationError(
          "Search query is required",
          "search",
          "input",
          input,
        );
      }

      // Сначала получаем всех пользователей с организациями
      const query = `
        SELECT 
          u.*,
          row_to_json(o.*) as organization
        FROM app_users u
        LEFT JOIN organizations o ON u.organization_id = o.id
      `;

      const result = await executeQuery<{
        id: number;
        name: string;
        organization_id: number;
        password: string;
        is_admin: boolean;
        created_at: Date;
        updated_at: Date;
        organization: Organization | null;
      }>(this._db, "search", query);

      const allUsers = result.map((row) => {
        const { organization, ...userData } = row;
        return {
          ...userData,
          organization: organization || undefined,
        } as UserWithOrganization;
      });

      // Настраиваем Fuse.js для поиска
      const fuseConfig: IFuseOptions<UserWithOrganization> = {
        keys: [
          { name: "name", weight: 0.7 },
          { name: "organization.name", weight: 0.3 },
        ],
        threshold: 0.4,
        minMatchCharLength: 2,
        findAllMatches: true,
        ignoreLocation: true,
        useExtendedSearch: true,
        shouldSort: true,
        includeScore: true,
      };

      const fuse = new Fuse(allUsers, fuseConfig);
      const searchResult = fuse.search(input);

      return searchResult.map((result) => result.item);
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof ValidationError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        "Failed to search users",
        "UserService",
        "search",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
