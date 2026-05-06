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

// GET /api/warehouse-history/warehouse/:warehouseId/search - поиск по истории склада
router.get(
  "/warehouse/:warehouseId/search",
  authMiddleware,
  warehouseHistoryController.search,
);

export { router as warehouseHistoryRouter };