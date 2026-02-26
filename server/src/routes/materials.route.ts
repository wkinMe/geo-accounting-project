import { MaterialController } from "@src/controllers";
import { pool } from "@src/db";
import { authMiddleware } from "@src/middleware/auth-middleware";
import { Router } from "express";
import { Request, Response } from "express";

export const materialsRouter = Router();
const materialController = new MaterialController(pool);

// GET /api/materials - получить все материалы
materialsRouter.get("/", authMiddleware, (req: Request, res: Response) => {
  materialController.findAll(req, res);
});

// GET /api/materials/search?q=wood - поиск материалов
materialsRouter.get(
  "/search",
  authMiddleware,
  (req: Request, res: Response) => {
    materialController.search(req, res);
  },
);

// GET /api/materials/:id - получить материал по ID
materialsRouter.get(
  "/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    materialController.findById(req, res);
  },
);

// POST /api/materials - создать новый материал
materialsRouter.post("/", authMiddleware, (req: Request, res: Response) => {
  materialController.create(req, res);
});

// PATCH /api/materials/:id - обновить материал
materialsRouter.patch(
  "/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    materialController.update(req, res);
  },
);

// DELETE /api/materials/:id - удалить материал
materialsRouter.delete(
  "/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    materialController.delete(req, res);
  },
);
