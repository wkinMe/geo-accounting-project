import { OrganizationController } from "@src/controllers";
import { pool } from "@src/db";
import { Router } from "express";

const organizationsRouter = Router();
const organizationController = new OrganizationController(pool);

// GET /api/organizations - получить все организации
organizationsRouter.get("/", (req, res) => {
  organizationController.findAll(req, res);
});

// GET /api/organizations/search?q=name - поиск организаций
organizationsRouter.get("/search", (req, res) => {
  organizationController.search(req, res);
});

// Если оставляете как есть с req.params, то нужно использовать такой роут:
organizationsRouter.get("/search/:search", (req, res) => {
  organizationController.search(req, res);
});

// GET /api/organizations/:id - получить организацию по ID
organizationsRouter.get("/:id", (req, res) => {
  organizationController.findById(req, res);
});

// POST /api/organizations - создать новую организацию
organizationsRouter.post("/", (req, res) => {
  organizationController.create(req, res);
});

// PATCH /api/organizations/:id - обновить организацию
organizationsRouter.patch("/:id", (req, res) => {
  organizationController.update(req, res);
});

// DELETE /api/organizations/:id - удалить организацию
organizationsRouter.delete("/:id", (req, res) => {
  organizationController.delete(req, res);
});

export default organizationsRouter;