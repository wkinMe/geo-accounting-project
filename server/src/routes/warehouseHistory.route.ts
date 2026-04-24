// routes/warehouseHistory.route.ts
import { Router } from "express";
import { WarehouseHistoryController } from "../controllers/WarehouseHistoryController";
import { authMiddleware } from "../middleware/auth-middleware";
import { roleMiddleware } from "../middleware/role-middleware";
import { USER_ROLES } from "@shared/constants";

const router = Router();
const warehouseHistoryController = new WarehouseHistoryController();

// GET /api/warehouse-history/warehouse/:warehouseId - получить историю по складу
router.get(
  "/warehouse/:warehouseId",
  authMiddleware,
  warehouseHistoryController.getByWarehouseId,
);

// GET /api/warehouse-history/agreement/:agreementId - получить историю по договору
router.get(
  "/agreement/:agreementId",
  authMiddleware,
  warehouseHistoryController.getByAgreementId,
);

// GET /api/warehouse-history/material/:materialId - получить историю по материалу
router.get(
  "/material/:materialId",
  authMiddleware,
  roleMiddleware([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]),
  warehouseHistoryController.getByMaterialId,
);

export { router as warehouseHistoryRouter };
