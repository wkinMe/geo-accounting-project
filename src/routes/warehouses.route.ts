import { WarehouseController } from "@src/controllers";
import { pool } from "@src/db";
import { Router } from "express";

const warehousesRouter = Router();
const warehouseController = new WarehouseController(pool);

// GET /api/warehouses - получить все склады
warehousesRouter.get("/", (req, res) => {
  warehouseController.findAll(req, res);
});

// GET /api/warehouses/search?q=name - поиск складов
warehousesRouter.get("/search", (req, res) => {
  warehouseController.search(req, res);
});

// GET /api/warehouses/manager/:managerId - получить склады по менеджеру
warehousesRouter.get("/manager/:managerId", (req, res) => {
  warehouseController.findByManagerId(req, res);
});

// GET /api/warehouses/:id - получить склад по ID
warehousesRouter.get("/:id", (req, res) => {
  warehouseController.findById(req, res);
});

// POST /api/warehouses - создать новый склад
warehousesRouter.post("/", (req, res) => {
  warehouseController.create(req, res);
});

// PATCH /api/warehouses/:id - обновить склад
warehousesRouter.patch("/:id", (req, res) => {
  warehouseController.update(req, res);
});

// PATCH /api/warehouses/:id/assign-manager - назначить/снять менеджера
warehousesRouter.patch("/:id/assign-manager", (req, res) => {
  warehouseController.assignManager(req, res);
});

// DELETE /api/warehouses/:id - удалить склад
warehousesRouter.delete("/:id", (req, res) => {
  warehouseController.delete(req, res);
});

export default warehousesRouter;