// controllers/WarehouseController.ts
import { Request, Response } from "express";
import { WarehouseRepository } from "../repositories/WarehouseRepository";
import { OrganizationRepository } from "../repositories/OrganizationRepository";
import { UserRepository } from "../repositories/UserRepository";
import { pool } from "../db";
import { CreateWarehouseDTO, UpdateWarehouseDTO } from "@shared/dto";
import { ValidationError, NotFoundError } from "@shared/service";
import { USER_ROLES } from "@shared/constants";
import { WarehouseService } from "../services";

export class WarehouseController {
  private warehouseService: WarehouseService;

  constructor() {
    const warehouseRepo = new WarehouseRepository(pool);
    const organizationRepo = new OrganizationRepository(pool);
    const userRepo = new UserRepository(pool);
    this.warehouseService = new WarehouseService(
      warehouseRepo,
      organizationRepo,
      userRepo,
    );
  }

  getAll = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      let organization_id: number | undefined;

      if (
        user &&
        (user.role === USER_ROLES.ADMIN ||
          user.role === USER_ROLES.MANAGER ||
          user.role === USER_ROLES.USER)
      ) {
        organization_id = user.organization_id;
      }

      const warehouses =
        await this.warehouseService.findAllWithDetails(organization_id);

      res.json({
        success: true,
        data: warehouses,
        count: warehouses.length,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      const warehouse = await this.warehouseService.findByIdWithDetails(id);

      if (!warehouse) {
        throw new NotFoundError(
          `Склад с ID ${id} не найден`,
          "Warehouse",
          "getById",
          id,
        );
      }

      res.json({
        success: true,
        data: warehouse,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const dto: CreateWarehouseDTO = req.body;
      const warehouse = await this.warehouseService.create(dto);

      // Получаем созданный склад с деталями
      const warehouseWithDetails =
        await this.warehouseService.findByIdWithDetails(warehouse.id!);

      res.status(201).json({
        success: true,
        data: warehouseWithDetails,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      const dto: UpdateWarehouseDTO = req.body;
      await this.warehouseService.update(id, dto);

      const warehouseWithDetails =
        await this.warehouseService.findByIdWithDetails(id);

      res.json({
        success: true,
        data: warehouseWithDetails,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      await this.warehouseService.delete(id);

      res.json({
        success: true,
        message: "Склад успешно удалён",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  findByManagerId = async (req: Request, res: Response) => {
    try {
      const managerId = this.parseId(req.params.managerId);
      const warehouses = await this.warehouseService.findByManagerId(managerId);

      res.json({
        success: true,
        data: warehouses.map((w) => w.toJSON()),
        count: warehouses.length,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  assignManager = async (req: Request, res: Response) => {
    try {
      const warehouseId = this.parseId(req.params.id);
      const { manager_id } = req.body;

      await this.warehouseService.assignManager(
        warehouseId,
        manager_id || null,
      );
      const warehouseWithDetails =
        await this.warehouseService.findByIdWithDetails(warehouseId);

      res.json({
        success: true,
        data: warehouseWithDetails,
        message: manager_id ? "Менеджер назначен" : "Менеджер откреплён",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  search = async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      const user = (req as any).user;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          error: "Параметр поиска 'q' обязателен",
        });
      }

      let organization_id: number | undefined;

      if (
        user &&
        (user.role === USER_ROLES.ADMIN ||
          user.role === USER_ROLES.MANAGER ||
          user.role === USER_ROLES.USER)
      ) {
        organization_id = user.organization_id;
      }

      const warehouses = await this.warehouseService.search(q, organization_id);

      res.json({
        success: true,
        data: warehouses.map((w) => w.toJSON()),
        count: warehouses.length,
        query: q,
      });
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
    console.error("WarehouseController error:", error);

    if (error instanceof ValidationError) {
      res
        .status(400)
        .json({ success: false, error: error.message, field: error.field });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ success: false, error: error.message });
    } else {
      res
        .status(500)
        .json({ success: false, error: "Внутренняя ошибка сервера" });
    }
  }
}
