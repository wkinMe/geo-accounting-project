import { Response } from "express";
import { UserService } from "../services/UserService";
import { UserRepository } from "../repositories/UserRepository";
import { RefreshTokenRepository } from "../repositories/RefreshTokenRepository";
import { OrganizationService } from "../services/OrganizationService";
import { OrganizationRepository } from "../repositories/OrganizationRepository";
import { pool } from "../db";
import { CreateUserDTO, UpdateUserDTO } from "@shared/dto";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "@shared/service";
import { RequestWithUser } from "../types";

export class UserController {
  private userService: UserService;

  constructor() {
    const userRepo = new UserRepository(pool);
    const refreshTokenRepo = new RefreshTokenRepository(pool);
    const organizationRepo = new OrganizationRepository(pool);
    const organizationService = new OrganizationService(organizationRepo);
    this.userService = new UserService(
      userRepo,
      refreshTokenRepo,
      organizationService,
    );
  }

  getAll = async (req: RequestWithUser, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as "ASC" | "DESC" | undefined;
      const organization_id = req.query.organization_id
        ? parseInt(req.query.organization_id as string)
        : undefined;

      const result = await this.userService.findAll(
        limit,
        offset,
        sortBy,
        sortOrder,
        organization_id,
      );

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getById = async (req: RequestWithUser, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      const user = await this.userService.findById(id);
      res.json({ success: true, data: user });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  register = async (req: RequestWithUser, res: Response) => {
    try {
      const dto: CreateUserDTO = req.body;
      const result = await this.userService.register(dto, req.user?.role);

      res.cookie("refreshToken", result.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  login = async (req: RequestWithUser, res: Response) => {
    try {
      const { name, password } = req.body;
      const result = await this.userService.login(name, password);

      res.cookie("refreshToken", result.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  refresh = async (req: RequestWithUser, res: Response) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const result = await this.userService.refreshToken(refreshToken);

      res.cookie("refreshToken", result.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
      });

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  logout = async (req: RequestWithUser, res: Response) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      await this.userService.logout(refreshToken);
      res.clearCookie("refreshToken");
      res.json({ success: true, message: "Выход выполнен успешно" });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getProfile = async (req: RequestWithUser, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, error: "Не авторизован" });
      }
      const user = await this.userService.findById(userId);
      res.json({ success: true, data: user });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  update = async (req: RequestWithUser, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      const dto: UpdateUserDTO = req.body;
      const user = await this.userService.update(
        id,
        dto,
        req.user?.role,
        req.user?.id,
      );
      res.json({ success: true, data: user });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  delete = async (req: RequestWithUser, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      await this.userService.delete(id, req.user?.role, req.user?.id);
      res.json({ success: true, message: "Пользователь успешно удалён" });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  search = async (req: RequestWithUser, res: Response) => {
    try {
      const { q } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as "ASC" | "DESC" | undefined;
      const organization_id = req.query.organization_id
        ? parseInt(req.query.organization_id as string)
        : undefined;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          error: "Параметр поиска 'q' обязателен",
        });
      }

      const result = await this.userService.search(
        q,
        limit,
        offset,
        sortBy,
        sortOrder,
        organization_id,
      );

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
        query: q,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  findByOrganizationId = async (req: RequestWithUser, res: Response) => {
    try {
      const organizationId = this.parseId(req.params.id);
      const users = await this.userService.findByOrganizationId(organizationId);
      res.json({ success: true, data: users });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getAdmins = async (req: RequestWithUser, res: Response) => {
    try {
      const organizationId = req.query.organization_id
        ? parseInt(req.query.organization_id as string)
        : undefined;
      const admins = await this.userService.findAdmins(organizationId);
      res.json({ success: true, data: admins });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getSuperAdmins = async (req: RequestWithUser, res: Response) => {
    try {
      const superAdmins = await this.userService.findSuperAdmins();
      res.json({ success: true, data: superAdmins });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private parseId(idParam: string | string[] | undefined): number {
    if (!idParam) {
      throw new ValidationError(
        "ID параметр обязателен",
        "parseId",
        "id",
        "undefined",
      );
    }
    const idString = Array.isArray(idParam) ? idParam[0] : idParam;
    const id = parseInt(idString, 10);
    if (isNaN(id)) {
      throw new ValidationError(
        "Неверный формат ID",
        "parseId",
        "id",
        idString,
      );
    }
    return id;
  }

  private handleError(error: unknown, res: Response): void {
    console.error("UserController error:", error);

    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
        field: error.field,
        operation: error.operation,
      });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    } else if (error instanceof ForbiddenError) {
      res.status(403).json({
        success: false,
        error: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Внутренняя ошибка сервера",
      });
    }
  }
}
