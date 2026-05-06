import { Request, Response } from "express";
import { InventoryService } from "../services/InventoryService";
import { InventoryRepository } from "../repositories/InventoryRepository";
import { WarehouseRepository } from "../repositories/WarehouseRepository";
import { MaterialRepository } from "../repositories/MaterialRepository";
import { WarehouseHistoryService } from "../services/WarehouseHistoryService";
import { WarehouseHistoryRepository } from "../repositories/WarehouseHistoryRepository";
import { pool } from "../db";
import { ValidationError, NotFoundError } from "@shared/service";

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    const inventoryRepo = new InventoryRepository(pool);
    const warehouseRepo = new WarehouseRepository(pool);
    const materialRepo = new MaterialRepository(pool);
    const historyRepo = new WarehouseHistoryRepository(pool);
    const historyService = new WarehouseHistoryService(
      historyRepo,
      warehouseRepo,
      materialRepo,
    );
    this.inventoryService = new InventoryService(
      inventoryRepo,
      warehouseRepo,
      materialRepo,
      historyService,
    );
  }

  getWarehouseStock = async (req: Request, res: Response) => {
    try {
      const warehouseId = this.parseId(req.params.warehouseId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as "ASC" | "DESC" | undefined;

      const result = await this.inventoryService.getWarehouseStock(
        warehouseId,
        limit,
        offset,
        sortBy,
        sortOrder,
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

  getMaterialDistribution = async (req: Request, res: Response) => {
    try {
      const materialId = this.parseId(req.params.materialId);
      const distribution =
        await this.inventoryService.getMaterialDistribution(materialId);

      res.json({
        success: true,
        data: distribution,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  findWarehouseWithMaxMaterial = async (req: Request, res: Response) => {
    try {
      const materialId = this.parseId(req.params.materialId);
      const result =
        await this.inventoryService.findWarehouseWithMaxMaterial(materialId);

      if (!result) {
        return res.json({
          success: true,
          data: null,
          message: "Материал не найден ни на одном складе",
        });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  findTopWarehousesByMaterial = async (req: Request, res: Response) => {
    try {
      const materialId = this.parseId(req.params.materialId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const result = await this.inventoryService.findTopWarehousesByMaterial(
        materialId,
        limit,
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  addMaterial = async (req: Request, res: Response) => {
    try {
      const warehouseId = this.parseId(req.params.warehouseId);
      const { material_id, amount } = req.body;
      const userId = (req as any).user?.id;

      if (!material_id) {
        throw new ValidationError(
          "ID материала обязателен",
          "addMaterial",
          "material_id",
          material_id,
        );
      }

      if (!amount || amount <= 0) {
        throw new ValidationError(
          "Количество должно быть положительным",
          "addMaterial",
          "amount",
          amount,
        );
      }

      const result = await this.inventoryService.addMaterial({
        warehouse_id: warehouseId,
        material_id: parseInt(material_id),
        amount,
        user_id: userId,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  removeMaterial = async (req: Request, res: Response) => {
    try {
      const warehouseId = this.parseId(req.params.warehouseId);
      const materialId = this.parseId(req.params.materialId);
      const { amount } = req.body;
      const userId = (req as any).user?.id;

      if (!amount || amount <= 0) {
        throw new ValidationError(
          "Количество должно быть положительным",
          "removeMaterial",
          "amount",
          amount,
        );
      }

      const result = await this.inventoryService.removeMaterial({
        warehouse_id: warehouseId,
        material_id: materialId,
        amount,
        user_id: userId,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  setAmount = async (req: Request, res: Response) => {
    try {
      const warehouseId = this.parseId(req.params.warehouseId);
      const materialId = this.parseId(req.params.materialId);
      const { amount } = req.body;
      const userId = (req as any).user?.id;

      if (amount === undefined || amount < 0) {
        throw new ValidationError(
          "Количество не может быть отрицательным",
          "setAmount",
          "amount",
          amount,
        );
      }

      const result = await this.inventoryService.setAmount({
        warehouse_id: warehouseId,
        material_id: materialId,
        amount,
        user_id: userId,
      });

      if (!result) {
        return res.json({
          success: true,
          data: null,
          message: "Материал удалён со склада",
        });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  checkAvailability = async (req: Request, res: Response) => {
    try {
      const warehouseId = this.parseId(req.params.warehouseId);
      const { requirements } = req.body;

      if (!requirements || !Array.isArray(requirements)) {
        throw new ValidationError(
          "Параметр requirements должен быть массивом",
          "checkAvailability",
          "requirements",
          requirements,
        );
      }

      const isAvailable = await this.inventoryService.checkAvailability(
        warehouseId,
        requirements,
      );

      res.json({
        success: true,
        data: { is_available: isAvailable },
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

  searchMaterials = async (req: Request, res: Response) => {
    try {
      const warehouseId = this.parseId(req.params.warehouseId);
      const { q } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as "ASC" | "DESC" | undefined;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          error: "Параметр поиска 'q' обязателен",
        });
      }

      const result = await this.inventoryService.searchMaterials(
        warehouseId,
        q,
        limit,
        offset,
        sortBy,
        sortOrder,
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

  private handleError(error: unknown, res: Response): void {
    console.error("InventoryController error:", error);

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
