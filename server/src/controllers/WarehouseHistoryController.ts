// server/src/controllers/WarehouseHistoryController.ts
import { Pool } from "pg";
import { Request, Response } from "express";
import { WarehouseHistoryService } from "@src/services/WarehouseHistoryService";
import { baseErrorHandling } from "@src/utils";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@shared/constants";

export class WarehouseHistoryController {
  private _warehouseHistoryService: WarehouseHistoryService;
  private entityName = "warehouse history";

  constructor(dbConnection: Pool) {
    this._warehouseHistoryService = new WarehouseHistoryService(dbConnection);
  }

  /**
   * Получение истории изменений материалов на складе
   */
  async getByWarehouseId(req: Request<{ warehouseId: string }>, res: Response) {
    try {
      const warehouseId = Number(req.params.warehouseId);

      if (isNaN(warehouseId) || warehouseId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("warehouse"),
        });
      }

      const history =
        await this._warehouseHistoryService.getHistoryByWarehouse(warehouseId);

      res.status(200).json({
        data: history,
        message: SUCCESS_MESSAGES.FIND_ALL(this.entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  /**
   * Получение истории изменений материалов по договору
   */
  async getByAgreementId(req: Request<{ agreementId: string }>, res: Response) {
    try {
      const agreementId = Number(req.params.agreementId);

      if (isNaN(agreementId) || agreementId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("agreement"),
        });
      }

      const history =
        await this._warehouseHistoryService.getHistoryByAgreement(agreementId);

      res.status(200).json({
        data: history,
        message: SUCCESS_MESSAGES.FIND_ALL(this.entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
