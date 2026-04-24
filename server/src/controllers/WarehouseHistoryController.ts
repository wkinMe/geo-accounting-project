// controllers/WarehouseHistoryController.ts
import { Request, Response } from "express";
import { WarehouseHistoryService } from "../services/WarehouseHistoryService";
import { WarehouseHistoryRepository } from "../repositories/WarehouseHistoryRepository";
import { WarehouseRepository } from "../repositories/WarehouseRepository";
import { MaterialRepository } from "../repositories/MaterialRepository";
import { pool } from "../db";
import { ValidationError, NotFoundError } from "@shared/service";

export class WarehouseHistoryController {
  private warehouseHistoryService: WarehouseHistoryService;

  constructor() {
    const historyRepo = new WarehouseHistoryRepository(pool);
    const warehouseRepo = new WarehouseRepository(pool);
    const materialRepo = new MaterialRepository(pool);
    this.warehouseHistoryService = new WarehouseHistoryService(
      historyRepo,
      warehouseRepo,
      materialRepo,
    );
  }

  getByWarehouseId = async (req: Request, res: Response) => {
    try {
      const warehouseId = this.parseId(req.params.warehouseId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string)
        : 0;

      const history = await this.warehouseHistoryService.getHistoryByWarehouse(
        warehouseId,
        limit,
        offset,
      );

      res.json({
        success: true,
        data: history.map((h) => h.toJSON()),
        count: history.length,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getByAgreementId = async (req: Request, res: Response) => {
    try {
      const agreementId = this.parseId(req.params.agreementId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string)
        : 0;

      const history = await this.warehouseHistoryService.getHistoryByAgreement(
        agreementId,
        limit,
        offset,
      );

      res.json({
        success: true,
        data: history.map((h) => h.toJSON()),
        count: history.length,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getByMaterialId = async (req: Request, res: Response) => {
    try {
      const materialId = this.parseId(req.params.materialId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string)
        : 0;

      const history = await this.warehouseHistoryService.getHistoryByMaterial(
        materialId,
        limit,
        offset,
      );

      res.json({
        success: true,
        data: history.map((h) => h.toJSON()),
        count: history.length,
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
    console.error("WarehouseHistoryController error:", error);

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
