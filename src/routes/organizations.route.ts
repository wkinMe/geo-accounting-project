import { OrganizationController } from "@src/controllers";
import { pool } from "@src/db";
import { authMiddleware } from "@src/middleware/auth-middleware";
import { Router } from "express";
import { Request, Response } from "express";

const organizationsRouter = Router();
const organizationController = new OrganizationController(pool);

// GET /api/organizations - получить все организации
organizationsRouter.get("/", (req: Request, res: Response) => {
  organizationController.findAll(req, res);
});

// GET /api/organizations/search?q=name - поиск организаций
organizationsRouter.get(
  "/search",
  (req: Request, res: Response) => {
    organizationController.search(req, res);
  },
);

// GET /api/organizations/:id - получить организацию по ID
organizationsRouter.get(
  "/:id",
  (req: Request<{ id: string }>, res: Response) => {
    organizationController.findById(req, res);
  },
);

// POST /api/organizations - создать новую организацию
organizationsRouter.post("/", authMiddleware, (req: Request, res: Response) => {
  organizationController.create(req, res);
});

// PATCH /api/organizations/:id - обновить организацию
organizationsRouter.patch(
  "/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    organizationController.update(req, res);
  },
);

// DELETE /api/organizations/:id - удалить организацию
organizationsRouter.delete(
  "/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    organizationController.delete(req, res);
  },
);

export default organizationsRouter;
