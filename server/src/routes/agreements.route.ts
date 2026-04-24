// routes/agreements.route.ts
import { Router } from "express";
import { AgreementController } from "../controllers/AgreementController";
import { authMiddleware } from "../middleware/auth-middleware";
import { roleMiddleware } from "../middleware/role-middleware";
import { USER_ROLES } from "@shared/constants";

const router = Router();
const agreementController = new AgreementController();

// GET /api/agreements - получить все договоры (с фильтром по роли)
router.get("/", authMiddleware, agreementController.getAll);

// GET /api/agreements/:id - получить договор по ID
router.get("/:id", authMiddleware, agreementController.getById);

// POST /api/agreements - создать новый договор
router.post(
  "/",
  authMiddleware,
  roleMiddleware([
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.MANAGER,
  ]),
  agreementController.create,
);

// PUT /api/agreements/:id - обновить договор
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware([
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.MANAGER,
  ]),
  agreementController.update,
);

// DELETE /api/agreements/:id - удалить договор
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware([
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.MANAGER,
  ]),
  agreementController.delete,
);

export { router as agreementsRouter };
