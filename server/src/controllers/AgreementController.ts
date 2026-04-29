// controllers/AgreementController.ts
import { Request, Response } from "express";
import { AgreementService } from "../services/AgreementService";
import { AgreementRepository } from "../repositories/AgreementRepository";
import { AgreementMaterialRepository } from "../repositories/AgreementMaterialRepository";
import { UserRepository } from "../repositories/UserRepository";
import { WarehouseRepository } from "../repositories/WarehouseRepository";
import { MaterialRepository } from "../repositories/MaterialRepository";
import { InventoryService } from "../services/InventoryService";
import { WarehouseHistoryService } from "../services/WarehouseHistoryService";
import { InventoryRepository } from "../repositories/InventoryRepository";
import { WarehouseHistoryRepository } from "../repositories/WarehouseHistoryRepository";
import { pool } from "../db";
import { AgreementCreateParams, AgreementUpdateParams } from "@shared/types";
import { ValidationError, NotFoundError } from "@shared/service";
import { UserDataDTO } from "@shared/dto";

export class AgreementController {
  private agreementService: AgreementService;

  constructor() {
    const agreementRepo = new AgreementRepository(pool);
    const agreementMaterialRepo = new AgreementMaterialRepository(pool);
    const userRepo = new UserRepository(pool);
    const warehouseRepo = new WarehouseRepository(pool);
    const materialRepo = new MaterialRepository(pool);
    const inventoryRepo = new InventoryRepository(pool);
    const historyRepo = new WarehouseHistoryRepository(pool);
    const historyService = new WarehouseHistoryService(
      historyRepo,
      warehouseRepo,
      materialRepo,
    );
    const inventoryService = new InventoryService(
      inventoryRepo,
      warehouseRepo,
      materialRepo,
      historyService,
    );

    this.agreementService = new AgreementService(
      agreementRepo,
      agreementMaterialRepo,
      userRepo,
      warehouseRepo,
      materialRepo,
      inventoryService,
      historyService,
    );
  }

  getAll = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as UserDataDTO;
      const agreements = await this.agreementService.findAllWithDetails(user);

      res.json({
        success: true,
        data: agreements,
        count: agreements.length,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      const agreement = await this.agreementService.findByIdWithDetails(id);

      res.json({
        success: true,
        data: agreement,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const agreement = await this.agreementService.create(req.body);

      res.status(201).json({
        success: true,
        data: agreement.toJSON(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      const params: AgreementUpdateParams = { id, ...req.body };
      const agreement = await this.agreementService.update(params);

      res.json({
        success: true,
        data: agreement.toJSON(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      await this.agreementService.delete(id);

      res.json({
        success: true,
        message: "Договор успешно удалён",
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
    console.error("AgreementController error:", error);

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
