// server/src/controllers/UserController.ts
import { UserService } from "@src/services";
import { baseErrorHandling } from "@src/utils";
import { Request, Response } from "express";
import { Pool } from "pg";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@shared/constants";
import { TokenService } from "@src/services/TokenService";
import { CreateUserDTO, UpdateUserDTO, UserDataDTO } from "@shared/dto";
import { User, UserRole } from "@shared/models";

export class UserController {
  private _userService: UserService;
  private _tokenService: TokenService;
  private entityName = "user";

  constructor(dbConnection: Pool) {
    this._userService = new UserService(dbConnection);
    this._tokenService = new TokenService(dbConnection);
  }

  async findAll(req: Request, res: Response) {
    try {
      const users = await this._userService.findAll();
      res.status(200).json({
        data: users,
        message: SUCCESS_MESSAGES.FIND_ALL(this.entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findById(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT(this.entityName),
        });
      }

      const user = await this._userService.findById(id);
      res.status(200).json({
        data: user,
        message: SUCCESS_MESSAGES.FIND_BY_ID(this.entityName, id),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT(this.entityName),
        });
      }

      // Получаем информацию о текущем пользователе из middleware
      // @ts-ignore - добавляем user в Request через middleware
      const currentUser = req.user;

      if (!currentUser) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const deletedUser = await this._userService.delete(
        id,
        currentUser.role,
        currentUser.id,
      );

      res.status(200).json({
        data: deletedUser,
        message: SUCCESS_MESSAGES.DELETE(this.entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async update(
    req: Request<{ id: string }, {}, Omit<UpdateUserDTO, "id">>,
    res: Response,
  ) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const userId = Number(id);

      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT(this.entityName),
        });
      }

      if (
        !updateData ||
        typeof updateData !== "object" ||
        Object.keys(updateData).length === 0
      ) {
        return res.status(400).json({
          message: ERROR_MESSAGES.UPDATE_DATA_REQUIRED,
        });
      }

      if (updateData.name !== undefined && updateData.name.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.EMPTY_FIELD("User name"),
        });
      }

      if (
        updateData.organization_id !== undefined &&
        isNaN(Number(updateData.organization_id))
      ) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("Organization ID"),
        });
      }

      if (
        updateData.password !== undefined &&
        updateData.password.trim() === ""
      ) {
        return res.status(400).json({
          message: ERROR_MESSAGES.EMPTY_FIELD("Password"),
        });
      }

      if (updateData.password !== undefined && updateData.password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters long",
        });
      }

      if (updateData.role !== undefined) {
        const validRoles: UserRole[] = [
          "super_admin",
          "admin",
          "manager",
          "user",
        ];
        if (!validRoles.includes(updateData.role as UserRole)) {
          return res.status(400).json({
            message: "Invalid role value",
          });
        }
      }

      // Получаем информацию о текущем пользователе из middleware
      // @ts-ignore - добавляем user в Request через middleware
      const currentUser = req.user;

      if (!currentUser) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const updatedUser = await this._userService.update({
        id: userId,
        ...updateData,
        requesterRole: currentUser.role,
      });

      res.status(200).json({
        data: updatedUser,
        message: SUCCESS_MESSAGES.UPDATE(this.entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async search(
    req: Request<{}, {}, {}, { q?: string; organization_id?: string }>,
    res: Response,
  ) {
    try {
      const { q, organization_id } = req.query;

      if (!q || q.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.SEARCH_QUERY_REQUIRED,
        });
      }

      const orgId = organization_id ? Number(organization_id) : undefined;

      if (organization_id && (isNaN(orgId!) || orgId! <= 0)) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("organization"),
        });
      }

      const searchedUsers = await this._userService.search(q, orgId);

      res.status(200).json({
        data: searchedUsers,
        message: SUCCESS_MESSAGES.SEARCH(this.entityName, searchedUsers.length),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async getAdmins(req: Request, res: Response) {
    try {
      const { organization_id } = req.query;

      let admins;
      if (organization_id) {
        const orgId = Number(organization_id);
        if (isNaN(orgId) || orgId <= 0) {
          return res.status(400).json({
            message: ERROR_MESSAGES.INVALID_ID_FORMAT("organization"),
          });
        }
        admins = await this._userService.findAdmins(orgId);
      } else {
        admins = await this._userService.findAdmins();
      }

      res.status(200).json({
        data: admins,
        message: SUCCESS_MESSAGES.GET_ADMINS(admins.length),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async getSuperAdmins(req: Request, res: Response) {
    try {
      const superAdmins = await this._userService.findSuperAdmins();
      res.status(200).json({
        data: superAdmins,
        message: `Found ${superAdmins.length} super administrators`,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findByOrganizationId(
    req: Request<{ id: string }, {}, {}>,
    res: Response,
  ) {
    try {
      const { id } = req.params;
      const orgId = Number(id);

      if (isNaN(orgId) || orgId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("organization"),
        });
      }

      const users = await this._userService.findByOrganizationId(orgId);

      res.status(200).json({
        data: users,
        message:
          users.length > 0
            ? SUCCESS_MESSAGES.FIND_BY_ORGANIZATION(
                this.entityName,
                users.length,
                users[0].organization?.name || "Unknown",
              )
            : `No users found for organization ${orgId}`,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async getAvailableManagers(req: Request, res: Response) {
    try {
      const { organization_id } = req.query;

      let availableManagers: User[];
      if (organization_id) {
        const orgId = Number(organization_id);
        if (isNaN(orgId) || orgId <= 0) {
          return res.status(400).json({
            message: ERROR_MESSAGES.INVALID_ID_FORMAT("organization"),
          });
        }
        availableManagers = await this._userService.getAvailableManagers(orgId);
      } else {
        availableManagers = await this._userService.getAvailableManagers();
      }

      res.status(200).json({
        data: availableManagers,
        message: SUCCESS_MESSAGES.GET_AVAILABLE_MANAGERS(
          availableManagers.length,
        ),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async register(req: Request<{}, {}, CreateUserDTO>, res: Response) {
    try {
      const { password, name, organization_id, role } = req.body;

      if (!password || !name) {
        return res.status(400).json({
          message: "Name and password are required",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters long",
        });
      }

      if (organization_id !== undefined) {
        if (isNaN(Number(organization_id)) || Number(organization_id) <= 0) {
          return res.status(400).json({
            message: ERROR_MESSAGES.INVALID_ID_FORMAT("organization"),
          });
        }
      }

      if (role !== undefined) {
        const validRoles: UserRole[] = [
          "super_admin",
          "admin",
          "manager",
          "user",
        ];
        if (!validRoles.includes(role)) {
          return res.status(400).json({
            message: "Invalid role value",
          });
        }
      }

      // Получаем информацию о текущем пользователе из middleware (если есть)
      // @ts-ignore
      const currentUser = req.user;
      const requesterRole = currentUser?.role;

      const result = await this._userService.register(
        {
          password,
          name,
          organization_id: organization_id
            ? Number(organization_id)
            : undefined,
          role,
        },
        requesterRole,
      );

      res.cookie("refreshToken", result.tokens.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.status(201).json({
        data: {
          user: result.user,
          tokens: {
            accessToken: result.tokens.accessToken,
          },
        },
        message: "User registered successfully",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async login(
    req: Request<{}, {}, { name: string; password: string }>,
    res: Response,
  ) {
    try {
      const { name, password } = req.body;

      if (!name || !password) {
        return res.status(400).json({
          message: "Name and password are required",
        });
      }

      const result = await this._userService.login(name, password);

      res.cookie("refreshToken", result.tokens.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.status(200).json({
        data: {
          user: result.user,
          tokens: {
            accessToken: result.tokens.accessToken,
          },
        },
        message: "Login successful",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          message: "Refresh token is required",
        });
      }

      const result = await this._userService.refreshToken(refreshToken);

      res.cookie("refreshToken", result.tokens.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.status(200).json({
        data: {
          user: result.user,
          tokens: {
            accessToken: result.tokens.accessToken,
          },
        },
        message: "Token refreshed successfully",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({
          message: "Refresh token is required",
        });
      }

      res.clearCookie("refreshToken");
      await this._userService.logout(refreshToken);

      res.status(200).json({
        message: "Logout successful",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      // @ts-ignore - добавляем user в Request через middleware
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const user = await this._userService.findById(userId);

      // Не отправляем пароль
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        data: userWithoutPassword,
        message: "Profile fetched successfully",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  /**
   * Поиск доступных менеджеров
   */
  async searchAvailableManagers(
    req: Request<{}, {}, {}, { q?: string; organization_id?: string }>,
    res: Response,
  ) {
    try {
      const { q, organization_id } = req.query;

      if (!q || q.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.SEARCH_QUERY_REQUIRED,
        });
      }

      const orgId = organization_id ? Number(organization_id) : undefined;

      if (organization_id && (isNaN(orgId!) || orgId! <= 0)) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("organization"),
        });
      }

      const managers = await this._userService.searchAvailableManagers(
        q,
        orgId,
      );

      res.status(200).json({
        data: managers,
        message: SUCCESS_MESSAGES.SEARCH("available managers", managers.length),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  /**
   * Проверка наличия super_admin в организации
   */
  async checkOrganizationHasSuperAdmin(
    req: Request<{ organizationId: string }>,
    res: Response,
  ) {
    try {
      const organizationId = Number(req.params.organizationId);

      if (isNaN(organizationId) || organizationId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("organization"),
        });
      }

      const hasSuperAdmin =
        await this._userService.checkOrganizationHasSuperAdmin(organizationId);

      res.status(200).json({
        data: { hasSuperAdmin },
        message: hasSuperAdmin
          ? "Organization has super admin"
          : "Organization does not have super admin",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
