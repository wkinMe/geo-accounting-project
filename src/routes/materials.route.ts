import { MaterialController } from "@src/controllers";
import { pool } from "@src/db";
import { Router } from "express";

export const materialsRouter = Router();
const materialController = new MaterialController(pool);

// GET /api/materials - получить все материалы
materialsRouter.get("/", (req, res) => {
  materialController.findAll(req, res);
});

// GET /api/materials/search?q=wood - поиск материалов
materialsRouter.get("/search", (req, res) => {
  materialController.search(req, res);
});

// GET /api/materials/:id - получить материал по ID
materialsRouter.get("/:id", (req, res) => {
  materialController.findById(req, res);
});

// POST /api/materials - создать новый материал
materialsRouter.post("/", (req, res) => {
  materialController.create(req, res);
});

// PATCH /api/materials/:id - обновить материал
materialsRouter.patch("/:id", (req, res) => {
  materialController.update(req, res);
});

// DELETE /api/materials/:id - удалить материал
materialsRouter.delete("/:id", (req, res) => {
  materialController.delete(req, res);
});