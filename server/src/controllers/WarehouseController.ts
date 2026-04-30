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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as "ASC" | "DESC" | undefined;
      let organization_id = req.query.organization_id
        ? parseInt(req.query.organization_id as string)
        : undefined;

      const result = await this.warehouseService.findAllWithDetails(
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

      const result = await this.warehouseService.search(
        q,
        limit,
        offset,
        sortBy,
        sortOrder,
        organization_id,
      );

      res.json({
        success: true,
        data: result.data, // Теперь data уже содержит organization и manager
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
