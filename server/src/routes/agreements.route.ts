import { AgreementController } from "@src/controllers";
import { pool } from "@src/db";
import { authMiddleware } from "@src/middleware/auth-middleware";
import { Router } from "express";
import { Request, Response } from "express";

const agreementsRouter = Router();
const agreementController = new AgreementController(pool);

// GET /api/agreements - получить все соглашения
agreementsRouter.get("/", authMiddleware, (req: Request, res: Response) => {
  agreementController.findAll(req, res);
});

// GET /api/agreements/search?q=query - поиск соглашений
agreementsRouter.get(
  "/search",
  authMiddleware,
  (req: Request, res: Response) => {
    agreementController.search(req, res);
  },
);

// GET /api/agreements/:id - получить соглашение по ID
agreementsRouter.get(
  "/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    agreementController.findById(req, res);
  },
);

// POST /api/agreements - создать новое соглашение
agreementsRouter.post("/", authMiddleware, (req, res) => {
  agreementController.create(req, res);
});

// PATCH /api/agreements/:id - обновить соглашение
agreementsRouter.patch(
  "/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    agreementController.update(req, res);
  },
);

// DELETE /api/agreements/:id - удалить соглашение
agreementsRouter.delete(
  "/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    agreementController.delete(req, res);
  },
);

export default agreementsRouter;
