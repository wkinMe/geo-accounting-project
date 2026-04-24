// routes/inventory.route.ts
import { Router } from "express";
import { InventoryController } from "../controllers/InventoryController";
import { authMiddleware } from "../middleware/auth-middleware";
import { roleMiddleware } from "../middleware/role-middleware";
import { USER_ROLES } from "@shared/constants";

const router = Router();
const inventoryController = new InventoryController();

// GET /api/inventory/warehouse/:warehouseId - получить все материалы на складе
router.get(
  "/warehouse/:warehouseId",
  authMiddleware,
  inventoryController.getWarehouseStock,
);

// GET /api/inventory/material/:materialId/distribution - распределение материала по складам
router.get(
  "/material/:materialId/distribution",
  authMiddleware,
  inventoryController.getMaterialDistribution,
);

// GET /api/inventory/material/:materialId/max-warehouse - склад с максимальным количеством материала
router.get(
  "/material/:materialId/max-warehouse",
  authMiddleware,
  inventoryController.findWarehouseWithMaxMaterial,
);

// GET /api/inventory/material/:materialId/top-warehouses - топ складов по материалу
router.get(
  "/material/:materialId/top-warehouses",
  authMiddleware,
  inventoryController.findTopWarehousesByMaterial,
);

// POST /api/inventory/warehouse/:warehouseId/materials - добавить материал на склад
router.post(
  "/warehouse/:warehouseId/materials",
  authMiddleware,
  roleMiddleware([
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.MANAGER,
  ]),
  inventoryController.addMaterial,
);

// PUT /api/inventory/warehouse/:warehouseId/materials/:materialId - установить точное количество материала
router.put(
  "/warehouse/:warehouseId/materials/:materialId",
  authMiddleware,
  roleMiddleware([
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.MANAGER,
  ]),
  inventoryController.setAmount,
);

// DELETE /api/inventory/warehouse/:warehouseId/materials/:materialId - удалить материал со склада
router.delete(
  "/warehouse/:warehouseId/materials/:materialId",
  authMiddleware,
  roleMiddleware([
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.MANAGER,
  ]),
  inventoryController.removeMaterial,
);

// POST /api/inventory/warehouse/:warehouseId/check-availability - проверить наличие материалов
router.post(
  "/warehouse/:warehouseId/check-availability",
  authMiddleware,
  inventoryController.checkAvailability,
);

export { router as inventoryRouter };
