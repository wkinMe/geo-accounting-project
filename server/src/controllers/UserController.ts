// controllers/UserController.ts
import { Request, Response } from "express";
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

  getAll = async (req: Request, res: Response) => {
    try {
      const users = await this.userService.findAll();
      res.json({
        success: true,
        data: users.map((u) => u.toJSON()),
        count: users.length,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      const user = await this.userService.findById(id);
      res.json({ success: true, data: user.toJSON() });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  register = async (req: Request, res: Response) => {
    try {
      const dto: CreateUserDTO = req.body;

      // @ts-expect-error в каждом запросе летит
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
          user: result.user.toJSON(),
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  login = async (req: Request, res: Response) => {
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
          user: result.user.toJSON(),
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  refresh = async (req: Request, res: Response) => {
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
          user: result.user.toJSON(),
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      await this.userService.logout(refreshToken);
      res.clearCookie("refreshToken");
      res.json({ success: true, message: "Logout successful" });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getProfile = async (req: Request, res: Response) => {
    try {
      // @ts-expect-error в каждом запросе летит
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }
      const user = await this.userService.findById(userId);
      res.json({ success: true, data: user.toJSON() });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      const dto: UpdateUserDTO = req.body;
      const user = await this.userService.update(
        id,
        dto,
        // @ts-expect-error
        req.user?.role,
        // @ts-expect-error
        req.user?.id,
      );
      res.json({ success: true, data: user.toJSON() });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);

      // @ts-expect-error в каждом запросе летит
      await this.userService.delete(id, req.user?.role, req.user?.id);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // controllers/UserController.ts - обновляем метод search
  search = async (req: Request, res: Response) => {
    try {
      const { q, organization_id } = req.query;

      if (!q || typeof q !== "string") {
        return res
          .status(400)
          .json({ success: false, error: "Search query is required" });
      }

      const orgId = organization_id
        ? parseInt(organization_id as string)
        : undefined;

      const users = await this.userService.search(q, orgId);
      res.json({
        success: true,
        data: users.map((u) => u.toJSON()),
        count: users.length,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  findByOrganizationId = async (req: Request, res: Response) => {
    try {
      const organizationId = this.parseId(req.params.id);
      const users = await this.userService.findByOrganizationId(organizationId);
      res.json({ success: true, data: users.map((u) => u.toJSON()) });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getAdmins = async (req: Request, res: Response) => {
    try {
      const organizationId = req.query.organization_id
        ? parseInt(req.query.organization_id as string)
        : undefined;
      const admins = await this.userService.findAdmins(organizationId);
      res.json({ success: true, data: admins.map((u) => u.toJSON()) });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getSuperAdmins = async (req: Request, res: Response) => {
    try {
      const superAdmins = await this.userService.findSuperAdmins();
      res.json({ success: true, data: superAdmins.map((u) => u.toJSON()) });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getAvailableManagers = async (req: Request, res: Response) => {
    try {
      const organizationId = req.query.organization_id
        ? parseInt(req.query.organization_id as string)
        : undefined;
      const managers =
        await this.userService.getAvailableManagers(organizationId);
      res.json({ success: true, data: managers.map((u) => u.toJSON()) });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  searchAvailableManagers = async (req: Request, res: Response) => {
    try {
      const { q, organization_id } = req.query;
      if (!q || typeof q !== "string") {
        return res
          .status(400)
          .json({ success: false, error: "Search query is required" });
      }
      const organizationId = organization_id
        ? parseInt(organization_id as string)
        : undefined;
      const managers = await this.userService.searchAvailableManagers(
        q,
        organizationId,
      );
      res.json({ success: true, data: managers.map((u) => u.toJSON()) });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private parseId(idParam: string | string[] | undefined): number {
    if (!idParam) {
      throw new ValidationError(
        "ID parameter is required",
        "parseId",
        "id",
        "undefined",
      );
    }
    const idString = Array.isArray(idParam) ? idParam[0] : idParam;
    const id = parseInt(idString, 10);
    if (isNaN(id)) {
      throw new ValidationError("Invalid ID format", "parseId", "id", idString);
    }
    return id;
  }

  private handleError(error: unknown, res: Response): void {
    console.error("UserController error:", error);

    if (error instanceof ValidationError) {
      res
        .status(400)
        .json({ success: false, error: error.message, field: error.field });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ success: false, error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(403).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
}
