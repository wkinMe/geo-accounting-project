// server/src/services/UserService.ts
import { Pool } from "pg";
import bcrypt from "bcrypt";
import Fuse, { IFuseOptions } from "fuse.js";

import { CreateUserDTO, UpdateUserDTO, UserDataDTO } from "@shared/dto";
import {
  Organization,
  User,
  UserWithOrganization,
  UserRole,
} from "@shared/models";
import { executeQuery, getSingleResult } from "@src/utils";
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
  ServiceError,
  UnauthorizedError,
  ForbiddenError,
} from "@src/errors/service";
import { TokenService } from "./TokenService";

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

  async findSuperAdmins(): Promise<UserWithOrganization[]> {
    try {
      const query = `
        SELECT 
          row_to_json(u.*) as user,
          row_to_json(o.*) as organization
        FROM app_users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.role = 'super_admin'
        ORDER BY u.id
      `;

      const result = await executeQuery<{
        user: User;
        organization: Organization;
      }>(this._db, "findSuperAdmins", query);

      return result.map((row) => ({
        ...row.user,
        organization: row.organization,
      }));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to retrieve super admins",
        "UserService",
        "findSuperAdmins",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async checkOrganizationHasSuperAdmin(
    organizationId: number,
  ): Promise<boolean> {
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1 FROM app_users 
          WHERE organization_id = $1 AND role = 'super_admin'
        ) as has_super_admin
      `;

      const result = await executeQuery<{ has_super_admin: boolean }>(
        this._db,
        "checkOrganizationHasSuperAdmin",
        query,
        [organizationId],
      );

      return result[0]?.has_super_admin || false;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to check if organization has super admin",
        "UserService",
        "checkOrganizationHasSuperAdmin",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async register(
    userData: CreateUserDTO,
    requesterRole?: UserRole,
  ): Promise<{
    user: User;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    try {
      if (!userData.name || userData.name.trim().length === 0) {
        throw new ValidationError(
          "User name is required",
          "register",
          "name",
          userData.name,
        );
      }

      if (!userData.password || userData.password.trim().length === 0) {
        throw new ValidationError(
          "Password is required",
          "register",
          "password",
          userData.password,
        );
      }

      // Проверка существующего пользователя
      const existingUserQuery = "SELECT id FROM app_users WHERE name = $1";
      const existingUser = await executeQuery<User>(
        this._db,
        "checkExistingUser",
        existingUserQuery,
        [userData.name.trim()],
      );

      if (existingUser.length > 0) {
        throw new ValidationError(
          "User with this name already exists",
          "register",
          "name",
          userData.name,
        );
      }

      // Определяем роль для нового пользователя
      let role: UserRole = userData.role;

      // if (userData.role) {
      //   // Проверка прав на назначение ролей
      //   if (userData.role === "super_admin") {
      //     // Только super_admin может создавать других super_admin
      //     if (requesterRole !== "super_admin") {
      //       throw new ForbiddenError(
      //         "Only super administrators can create other super administrators",
      //         "register",
      //       );
      //     }
      //     role = "super_admin";
      //   } else if (userData.role === "admin") {
      //     // Admin может создавать других admin (но не super_admin)
      //     if (requesterRole !== "super_admin" && requesterRole !== "admin") {
      //       throw new ForbiddenError(
      //         "Only administrators can create other administrators",
      //         "register",
      //       );
      //     }

      //     // Проверяем, есть ли уже super_admin в этой организации
      //     if (userData.organization_id) {
      //       const hasSuperAdmin = await this.checkOrganizationHasSuperAdmin(
      //         userData.organization_id,
      //       );
      //       if (!hasSuperAdmin) {
      //         throw new ValidationError(
      //           "Cannot create admin: organization must have at least one super admin first",
      //           "register",
      //           "role",
      //           userData.role,
      //         );
      //       }
      //     }

      //     role = "admin";
      //   } else if (userData.role === "manager") {
      //     role = "manager";
      //   } else {
      //     role = "user";
      //   }
      // }

      const salt = await bcrypt.genSalt(8);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const createQuery = `
        INSERT INTO app_users (name, organization_id, password, role) 
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const createResult = await executeQuery<User>(
        this._db,
        "register",
        createQuery,
        [userData.name.trim(), userData.organization_id, hashedPassword, role],
      );

      if (createResult.length === 0) {
        throw new ServiceError(
          "Failed to register user - no data returned",
          "UserService",
          "register",
          new Error("No data returned from INSERT query"),
        );
      }

      const newUser = createResult[0];

      const tokenService = new TokenService(this._db);

      const userDataForToken: UserDataDTO = {
        id: newUser.id,
        name: newUser.name,
        organization_id: newUser.organization_id,
        role: newUser.role,
      };

      const tokens = await tokenService.generateTokens(userDataForToken);
      await tokenService.saveRefreshToken(newUser.id, tokens.refreshToken);

      return {
        user: newUser,
        tokens,
      };
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof ValidationError ||
        error instanceof ForbiddenError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        "Failed to register user",
        "UserService",
        "register",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async login(
    name: string,
    password: string,
  ): Promise<{
    user: User;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    try {
      if (!name || name.trim().length === 0) {
        throw new ValidationError(
          "Username is required",
          "login",
          "name",
          name,
        );
      }

      if (!password || password.trim().length === 0) {
        throw new ValidationError(
          "Password is required",
          "login",
          "password",
          password,
        );
      }

      const query = `
        SELECT id, name, organization_id, password, role, created_at, updated_at
        FROM app_users 
        WHERE name = $1
      `;

      const result = await executeQuery<User & { password: string }>(
        this._db,
        "login",
        query,
        [name.trim()],
      );

      if (result.length === 0) {
        throw new ValidationError("Invalid username or password", "login");
      }

      const user = result[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new ValidationError("Invalid username or password", "login");
      }

      const { password: _, ...userWithoutPassword } = user;
      const tokenService = new TokenService(this._db);

      const userDataForToken: UserDataDTO = {
        id: user.id,
        name: user.name,
        organization_id: user.organization_id,
        role: user.role,
      };

      const tokens = await tokenService.generateTokens(userDataForToken);
      await tokenService.saveRefreshToken(user.id, tokens.refreshToken);

      return {
        user: userWithoutPassword as User,
        tokens,
      };
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof ValidationError ||
        error instanceof UnauthorizedError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        "Failed to login",
        "UserService",
        "login",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      if (!refreshToken) {
        throw new ValidationError(
          "Refresh token is required",
          "logout",
          "refreshToken",
          refreshToken,
        );
      }

      const tokenService = new TokenService(this._db);
      await tokenService.deleteRefreshToken(refreshToken);
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof ValidationError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        "Failed to logout",
        "UserService",
        "logout",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async refreshToken(refreshToken: string): Promise<{
    user: UserWithOrganization;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    try {
      if (!refreshToken) {
        throw new UnauthorizedError("Invalid or expired token", "refreshToken");
      }
      const tokenService = new TokenService(this._db);

      const verifiedUserData = tokenService.verifyRefreshToken(refreshToken);
      const tokenFromDb = await tokenService.findRefreshToken(refreshToken);

      if (!verifiedUserData || !tokenFromDb) {
        throw new UnauthorizedError("Invalid or expired token", "refreshToken");
      }

      const currentUserData = await this.findById(verifiedUserData.id);
      const { organization, ...userDataWithoutOrg } = currentUserData;
      const tokens = await tokenService.generateTokens(userDataWithoutOrg);
      await tokenService.saveRefreshToken(
        userDataWithoutOrg.id,
        tokens.refreshToken,
      );

      return {
        user: currentUserData,
        tokens,
      };
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof ValidationError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new ServiceError(
        "Failed to refresh token",
        "UserService",
        "refreshToken",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async update({
    id,
    name,
    organization_id,
    password,
    role,
    requesterRole,
  }: UpdateUserDTO & {
    requesterRole?: UserRole;
  }): Promise<User> {
    try {
      // Проверяем существование пользователя
      const targetUser = await this.findById(id);

      // Валидация прав на изменение роли
      if (role !== undefined) {
        // Проверка прав на изменение роли
        if (!requesterRole) {
          throw new ForbiddenError(
            "Requester role is required for role modification",
            "update",
          );
        }

        // Правила изменения ролей:
        // 1. Только super_admin может назначать/снимать роль super_admin
        // 2. super_admin и admin могут назначать/снимать роли admin, manager, user
        // 3. Никто не может изменить роль super_admin, кроме другого super_admin
        // 4. Нельзя удалить последнего super_admin в организации

        if (
          targetUser.role === "super_admin" &&
          requesterRole !== "super_admin"
        ) {
          throw new ForbiddenError(
            "Only super administrators can modify super administrator roles",
            "update",
          );
        }

        if (role === "super_admin" && requesterRole !== "super_admin") {
          throw new ForbiddenError(
            "Only super administrators can assign super administrator role",
            "update",
          );
        }

        // Проверка на удаление последнего super_admin в организации
        if (targetUser.role === "super_admin" && role !== "super_admin") {
          const superAdminsCount = await this.countSuperAdminsInOrganization(
            targetUser.organization_id,
          );
          if (superAdminsCount <= 1) {
            throw new ValidationError(
              "Cannot remove the last super administrator in the organization",
              "update",
              "role",
              role,
            );
          }
        }

        // При назначении admin проверяем наличие super_admin в организации
        if (role === "admin" && targetUser.role !== "admin") {
          const hasSuperAdmin = await this.checkOrganizationHasSuperAdmin(
            organization_id || targetUser.organization_id,
          );
          if (!hasSuperAdmin) {
            throw new ValidationError(
              "Cannot assign admin role: organization must have at least one super admin",
              "update",
              "role",
              role,
            );
          }
        }
      }

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

      if (role !== undefined) {
        updates.push(`role = $${paramIndex}`);
        values.push(role);
        paramIndex++;
      }

      // Если нет полей для обновления, возвращаем текущего пользователя
      if (updates.length === 0) {
        return targetUser;
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
        error instanceof ForbiddenError ||
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

  private async countSuperAdminsInOrganization(
    organizationId: number,
  ): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM app_users
        WHERE organization_id = $1 AND role = 'super_admin'
      `;

      const result = await executeQuery<{ count: string }>(
        this._db,
        "countSuperAdminsInOrganization",
        query,
        [organizationId],
      );

      return parseInt(result[0]?.count || "0", 10);
    } catch (error) {
      throw new ServiceError(
        "Failed to count super admins in organization",
        "UserService",
        "countSuperAdminsInOrganization",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async delete(
    id: number,
    requesterRole?: UserRole,
    requesterId?: number,
  ): Promise<User> {
    try {
      // Проверяем существование пользователя перед удалением
      const targetUser = await this.findById(id);

      // Проверка прав на удаление
      if (!requesterRole) {
        throw new ForbiddenError(
          "Requester role is required for user deletion",
          "delete",
        );
      }

      // Нельзя удалить самого себя (безопасность)
      if (requesterId === id) {
        throw new ForbiddenError("Cannot delete your own account", "delete");
      }

      // Проверка на удаление super_admin
      if (
        targetUser.role === "super_admin" &&
        requesterRole !== "super_admin"
      ) {
        throw new ForbiddenError(
          "Only super administrators can delete other super administrators",
          "delete",
        );
      }

      // Проверка на удаление последнего super_admin в организации
      if (targetUser.role === "super_admin") {
        const superAdminsCount = await this.countSuperAdminsInOrganization(
          targetUser.organization_id,
        );
        if (superAdminsCount <= 1) {
          throw new ValidationError(
            "Cannot delete the last super administrator in the organization",
            "delete",
            "id",
            id.toString(),
          );
        }
      }

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
        error instanceof ForbiddenError ||
        error instanceof ValidationError ||
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

  async findAdmins(organizationId?: number): Promise<UserWithOrganization[]> {
    try {
      let query = `
        SELECT 
          row_to_json(u.*) as user,
          row_to_json(o.*) as organization
        FROM app_users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.role IN ('super_admin', 'admin')
      `;

      const values: any[] = [];

      if (organizationId !== undefined) {
        query += " AND u.organization_id = $1";
        values.push(organizationId);
      }

      query += " ORDER BY u.id";

      const result = await executeQuery<{
        user: User;
        organization: Organization;
      }>(this._db, "findAdmins", query, values);

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
        WHERE u.role = 'manager'
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

  async searchAvailableManagers(
    input: string,
    organizationId?: number,
  ): Promise<UserWithOrganization[]> {
    try {
      if (!input || input.trim().length === 0) {
        throw new ValidationError(
          "Search query is required",
          "searchAvailableManagers",
          "UserService",
          "input",
          input,
        );
      }

      const results = (await this.search(input, organizationId)).filter(
        (i) =>
          i.role === "manager" ||
          i.role === "admin" ||
          i.role === "super_admin",
      );

      return results;
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

  async search(
    input: string,
    organization_id?: number,
  ): Promise<UserWithOrganization[]> {
    try {
      if (!input || input.trim().length === 0) {
        throw new ValidationError(
          "Search query is required",
          "search",
          "UserService",
          "input",
          input,
        );
      }

      let result: UserWithOrganization[];
      if (organization_id) {
        result = await this.findByOrganizationId(organization_id);
      } else {
        result = await this.findAll();
      }

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
