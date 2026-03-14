import { WarehouseController } from "@src/controllers";
import { pool } from "@src/db";
import { authMiddleware } from "@src/middleware/auth-middleware";
import { Router } from "express";
import { Request, Response } from "express";
import { roleMiddleware } from "../middleware";

const warehousesRouter = Router();
const warehouseController = new WarehouseController(pool);

// GET /api/warehouses - получить все склады
warehousesRouter.get("/", authMiddleware, (req: Request, res: Response) => {
  warehouseController.findAll(req, res);
});

// GET /api/warehouses/search?q=name - поиск складов
warehousesRouter.get(
  "/search",
  authMiddleware,
  (req: Request, res: Response) => {
    warehouseController.search(req, res);
  },
);

// GET /api/warehouses/manager/:managerId - получить склады по менеджеру
warehousesRouter.get(
  "/manager/:managerId",
  authMiddleware,
  (req: Request<{ managerId: string }>, res: Response) => {
    warehouseController.findByManagerId(req, res);
  },
);

// GET /api/warehouses/:id - получить склад по ID
warehousesRouter.get(
  "/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    warehouseController.findById(req, res);
  },
);

// POST /api/warehouses - создать новый склад
warehousesRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  (req: Request, res: Response) => {
    warehouseController.create(req, res);
  },
);

// PATCH /api/warehouses/:id - обновить склад
warehousesRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "super_admin", "manager"]),
  (req: Request<{ id: string }>, res: Response) => {
    warehouseController.update(req, res);
  },
);

// PATCH /api/warehouses/:id/assign-manager - назначить/снять менеджера
warehousesRouter.patch(
  "/:id/assign-manager",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  (req: Request<{ id: string }>, res: Response) => {
    warehouseController.assignManager(req, res);
  },
);

// DELETE /api/warehouses/:id - удалить склад
warehousesRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  (req: Request<{ id: string }>, res: Response) => {
    warehouseController.delete(req, res);
  },
);

// POST /api/warehouses/:id/materials - добавить материал на склад
warehousesRouter.post(
  "/:id/materials",
  authMiddleware,
  roleMiddleware(["admin", "super_admin", "manager"]),
  (req: Request<{ id: string }>, res: Response) => {
    warehouseController.addMaterial(req, res);
  },
);

// GET /api/warehouses/:id/materials - получить все материалы со склада
warehousesRouter.get(
  "/:id/materials",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    warehouseController.getMaterials(req, res);
  },
);

// GET /api/warehouses/:id/materials/search - поиск материалов на складе
warehousesRouter.get(
  "/:id/materials/search",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    warehouseController.searchMaterialByWarehouse(req, res);
  },
);

// PATCH /api/warehouses/:id/materials/:materialId - обновить количество материала
warehousesRouter.patch(
  "/:id/materials/:materialId",
  authMiddleware,
  roleMiddleware(["admin", "super_admin", "manager"]),
  (req: Request<{ id: string; materialId: string }>, res: Response) => {
    warehouseController.updateMaterialAmount(req, res);
  },
);

// DELETE /api/warehouses/:id/materials/:materialId - удалить материал со склада
warehousesRouter.delete(
  "/:id/materials/:materialId",
  authMiddleware,
  roleMiddleware(["admin", "super_admin", "manager"]),
  (req: Request<{ id: string; materialId: string }>, res: Response) => {
    warehouseController.removeMaterial(req, res);
  },
);

export default warehousesRouter;
