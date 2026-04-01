// server/src/routes/warehouseHistory.route.ts
import { Router } from "express";
import { WarehouseHistoryController } from "@src/controllers/WarehouseHistoryController";
import { pool } from "@src/db";
import { authMiddleware } from "@src/middleware/auth-middleware";
import { Request, Response } from "express";

const warehouseHistoryRouter = Router();
const warehouseHistoryController = new WarehouseHistoryController(pool);

// GET /api/warehouse-history/warehouse/:warehouseId - получить историю по складу
warehouseHistoryRouter.get(
  "/warehouse/:warehouseId",
  authMiddleware,
  (req: Request<{ warehouseId: string }>, res: Response) => {
    warehouseHistoryController.getByWarehouseId(req, res);
  },
);

// GET /api/warehouse-history/agreement/:agreementId - получить историю по договору
warehouseHistoryRouter.get(
  "/agreement/:agreementId",
  authMiddleware,
  (req: Request<{ agreementId: string }>, res: Response) => {
    warehouseHistoryController.getByAgreementId(req, res);
  },
);

export default warehouseHistoryRouter;
