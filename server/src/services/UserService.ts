// services/UserService.ts
import bcrypt from "bcrypt";
import { User } from "../domain/entities/User";
import { RefreshToken } from "../domain/entities/RefreshToken";
import { UserRepository } from "../repositories/UserRepository";
import { RefreshTokenRepository } from "../repositories/RefreshTokenRepository";
import { OrganizationService } from "./OrganizationService";
import { TokenService } from "./TokenService";
import { CreateUserDTO, UpdateUserDTO, UserDataDTO } from "@shared/dto";
import { USER_ROLES } from "@shared/constants";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "@shared/service";

export class UserService {
  private tokenService: TokenService;

  constructor(
    private userRepo: UserRepository,
    private refreshTokenRepo: RefreshTokenRepository,
    private organizationService: OrganizationService,
  ) {
    this.tokenService = new TokenService();
  }

  async findAll(): Promise<User[]> {
    return await this.userRepo.findAll();
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError(
        `Пользователь с ID ${id} не найден`,
        "User",
        "findById",
        id,
      );
    }
    return user;
  }

  async findByOrganizationId(organizationId: number): Promise<User[]> {
    return await this.userRepo.findByOrganizationId(organizationId);
  }

  async findAdmins(organizationId?: number): Promise<User[]> {
    if (organizationId) {
      const users = await this.userRepo.findByOrganizationId(organizationId);
      return users.filter(
        (u) => u.role === USER_ROLES.SUPER_ADMIN || u.role === USER_ROLES.ADMIN,
      );
    }
    const superAdmins = await this.userRepo.findByRole(USER_ROLES.SUPER_ADMIN);
    const admins = await this.userRepo.findByRole(USER_ROLES.ADMIN);
    return [...superAdmins, ...admins];
  }

  async findSuperAdmins(): Promise<User[]> {
    return await this.userRepo.findByRole(USER_ROLES.SUPER_ADMIN);
  }

  async register(
    dto: CreateUserDTO,
    requesterRole?: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    this.validateCreateDTO(dto);

    const existing = await this.userRepo.findByName(dto.name);
    if (existing) {
      throw new ValidationError(
        "Пользователь с таким именем уже существует",
        "register",
        "name",
        dto.name,
      );
    }

    let role = dto.role || USER_ROLES.USER;

    if (role === USER_ROLES.ADMIN && dto.organization_id) {
      const canAssign = await this.organizationService.canAssignAdminRole(
        dto.organization_id,
      );
      if (!canAssign) {
        throw new ValidationError(
          "Нельзя назначить роль администратора: в организации должен быть хотя бы один главный администратор",
          "register",
          "role",
          role,
        );
      }
    }

    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = User.create(
      dto.name,
      hashedPassword,
      role as any,
      dto.organization_id,
    );
    const savedUser = await this.userRepo.save(user);

    const userDataForToken: UserDataDTO = {
      id: savedUser.id!,
      name: savedUser.name,
      organization_id: savedUser.organization_id ?? null,
      role: savedUser.role,
    };

    const tokens = this.tokenService.generateTokens(userDataForToken);

    const refreshToken = RefreshToken.create(
      savedUser.id!,
      tokens.refreshToken,
    );
    await this.refreshTokenRepo.save(refreshToken);

    return {
      user: savedUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(
    name: string,
    password: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    if (!name || !password) {
      throw new ValidationError(
        "Имя пользователя и пароль обязательны",
        "login",
        "name",
        name,
      );
    }

    const user = await this.userRepo.findByName(name);
    if (!user) {
      throw new ValidationError(
        "Неверное имя пользователя или пароль",
        "login",
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ValidationError(
        "Неверное имя пользователя или пароль",
        "login",
      );
    }

    const userDataForToken: UserDataDTO = {
      id: user.id!,
      name: user.name,
      organization_id: user.organization_id ?? null,
      role: user.role,
    };

    const tokens = this.tokenService.generateTokens(userDataForToken);

    const refreshToken = RefreshToken.create(user.id!, tokens.refreshToken);
    await this.refreshTokenRepo.save(refreshToken);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      throw new ValidationError(
        "Refresh токен обязателен",
        "logout",
        "refreshToken",
        refreshToken,
      );
    }
    await this.refreshTokenRepo.delete(refreshToken);
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    if (!refreshToken) {
      throw new ValidationError("Refresh токен обязателен", "refreshToken");
    }

    try {
      const verifiedUserData =
        this.tokenService.verifyRefreshToken(refreshToken);
      const tokenFromDb = await this.refreshTokenRepo.findByToken(refreshToken);

      if (!verifiedUserData || !tokenFromDb) {
        throw new ValidationError(
          "Неверный или просроченный refresh токен",
          "refreshToken",
        );
      }

      const user = await this.findById(verifiedUserData.id);

      const userDataForToken: UserDataDTO = {
        id: user.id!,
        name: user.name,
        organization_id: user.organization_id ?? null,
        role: user.role,
      };

      const tokens = this.tokenService.generateTokens(userDataForToken);

      const newRefreshToken = RefreshToken.create(
        user.id!,
        tokens.refreshToken,
      );
      await this.refreshTokenRepo.save(newRefreshToken);

      return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      // Если refresh token невалиден - удаляем его из БД
      await this.refreshTokenRepo.delete(refreshToken);
      throw error;
    }
  }

  async update(
    id: number,
    dto: UpdateUserDTO,
    requesterRole?: string,
    requesterId?: number,
  ): Promise<User> {
    const existingUser = await this.findById(id);
    this.validateUpdateDTO(dto);

    if (dto.role !== undefined) {
      this.validateRoleChange(existingUser, dto.role, requesterRole);
    }

    if (
      existingUser.role === USER_ROLES.SUPER_ADMIN &&
      dto.role !== USER_ROLES.SUPER_ADMIN &&
      existingUser.organization_id
    ) {
      const canRemove = await this.organizationService.canRemoveSuperAdmin(
        existingUser.organization_id,
      );
      if (!canRemove) {
        throw new ValidationError(
          "Нельзя удалить последнего главного администратора в организации",
          "update",
          "role",
          dto.role,
        );
      }
    }

    if (
      dto.role === USER_ROLES.ADMIN &&
      existingUser.role !== USER_ROLES.ADMIN &&
      dto.organization_id
    ) {
      const canAssign = await this.organizationService.canAssignAdminRole(
        dto.organization_id,
      );
      if (!canAssign) {
        throw new ValidationError(
          "Нельзя назначить роль администратора: в организации должен быть хотя бы один главный администратор",
          "update",
          "role",
          dto.role,
        );
      }
    }

    if (dto.name !== undefined) {
      existingUser.updateName(dto.name);
    }

    if (dto.organization_id !== undefined) {
      existingUser.updateOrganization(dto.organization_id);
    }

    if (dto.password !== undefined) {
      existingUser.updatePassword(dto.password);
    }

    if (dto.role !== undefined) {
      existingUser.updateRole(dto.role as any);
    }

    return await this.userRepo.update(id, existingUser);
  }

  async delete(
    id: number,
    requesterRole?: string,
    requesterId?: number,
  ): Promise<void> {
    const targetUser = await this.findById(id);

    if (!requesterRole) {
      throw new ForbiddenError(
        "Роль запрашивающего пользователя обязательна для удаления",
        "delete",
      );
    }

    if (requesterId === id) {
      throw new ForbiddenError(
        "Нельзя удалить свою собственную учётную запись",
        "delete",
      );
    }

    if (
      targetUser.role === USER_ROLES.SUPER_ADMIN &&
      requesterRole !== USER_ROLES.SUPER_ADMIN
    ) {
      throw new ForbiddenError(
        "Только главные администраторы могут удалять других главных администраторов",
        "delete",
      );
    }

    if (
      targetUser.role === USER_ROLES.SUPER_ADMIN &&
      targetUser.organization_id
    ) {
      const canRemove = await this.organizationService.canRemoveSuperAdmin(
        targetUser.organization_id,
      );
      if (!canRemove) {
        throw new ValidationError(
          "Нельзя удалить последнего главного администратора в организации",
          "delete",
          "id",
          id.toString(),
        );
      }
    }

    await this.userRepo.delete(id);
    await this.refreshTokenRepo.deleteByUserId(id);
  }

  async search(query: string): Promise<User[]> {
    if (!query || query.trim().length === 0) {
      return await this.findAll();
    }
    return await this.userRepo.search(query.trim());
  }

  async getAvailableManagers(organizationId?: number): Promise<User[]> {
    const users = organizationId
      ? await this.userRepo.findByOrganizationId(organizationId)
      : await this.findAll();

    return users.filter(
      (u) =>
        u.role === USER_ROLES.MANAGER ||
        u.role === USER_ROLES.ADMIN ||
        u.role === USER_ROLES.SUPER_ADMIN,
    );
  }

  async searchAvailableManagers(
    query: string,
    organizationId?: number,
  ): Promise<User[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    let users = await this.search(query);
    users = users.filter(
      (u) =>
        u.role === USER_ROLES.MANAGER ||
        u.role === USER_ROLES.ADMIN ||
        u.role === USER_ROLES.SUPER_ADMIN,
    );

    if (organizationId) {
      users = users.filter((u) => u.organization_id === organizationId);
    }

    return users;
  }

  private validateCreateDTO(dto: CreateUserDTO): void {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new ValidationError(
        "Имя пользователя обязательно",
        "register",
        "name",
        dto.name,
      );
    }
    if (!dto.password || dto.password.length < 6) {
      throw new ValidationError(
        "Пароль должен содержать минимум 6 символов",
        "register",
        "password",
        dto.password,
      );
    }
  }

  private validateUpdateDTO(dto: UpdateUserDTO): void {
    if (dto.name !== undefined && dto.name.trim().length === 0) {
      throw new ValidationError(
        "Имя пользователя не может быть пустым",
        "update",
        "name",
        dto.name,
      );
    }
    if (dto.password !== undefined && dto.password.length < 6) {
      throw new ValidationError(
        "Пароль должен содержать минимум 6 символов",
        "update",
        "password",
        dto.password,
      );
    }
  }

  private validateRoleChange(
    targetUser: User,
    newRole: string,
    requesterRole?: string,
  ): void {
    if (!requesterRole) {
      throw new ForbiddenError(
        "Роль запрашивающего пользователя обязательна для изменения роли",
        "update",
      );
    }

    if (
      targetUser.role === USER_ROLES.SUPER_ADMIN &&
      requesterRole !== USER_ROLES.SUPER_ADMIN
    ) {
      throw new ForbiddenError(
        "Только главные администраторы могут изменять роли главных администраторов",
        "update",
      );
    }

    if (
      newRole === USER_ROLES.SUPER_ADMIN &&
      requesterRole !== USER_ROLES.SUPER_ADMIN
    ) {
      throw new ForbiddenError(
        "Только главные администраторы могут назначать роль главного администратора",
        "update",
      );
    }
  }
}
