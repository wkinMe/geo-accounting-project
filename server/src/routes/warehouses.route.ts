// routes/warehouses.route.ts
import { Router } from "express";
import { WarehouseController } from "../controllers/WarehouseController";
import { authMiddleware } from "../middleware/auth-middleware";
import { roleMiddleware } from "../middleware/role-middleware";
import { USER_ROLES } from "@shared/constants";

const router = Router();
const warehouseController = new WarehouseController();

// GET /api/warehouses - получить все склады (с фильтром по организации)
router.get("/", authMiddleware, warehouseController.getAll);

// GET /api/warehouses/:id - получить склад по ID
router.get("/:id", authMiddleware, warehouseController.getById);

// GET /api/warehouses/manager/:managerId - получить склады по менеджеру
router.get(
  "/manager/:managerId",
  authMiddleware,
  warehouseController.findByManagerId,
);

// POST /api/warehouses - создать новый склад
router.post(
  "/",
  authMiddleware,
  roleMiddleware([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]),
  warehouseController.create,
);

// PUT /api/warehouses/:id - обновить склад
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware([
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.MANAGER,
  ]),
  warehouseController.update,
);

// PATCH /api/warehouses/:id/assign-manager - назначить/снять менеджера
router.patch(
  "/:id/assign-manager",
  authMiddleware,
  roleMiddleware([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]),
  warehouseController.assignManager,
);

// DELETE /api/warehouses/:id - удалить склад
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]),
  warehouseController.delete,
);

export { router as warehousesRouter };
