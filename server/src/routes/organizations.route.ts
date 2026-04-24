// routes/organizations.route.ts
import { Router } from "express";
import { OrganizationController } from "../controllers/OrganizationController";
import { OrganizationService } from "../services/OrganizationService";
import { OrganizationRepository } from "../repositories/OrganizationRepository";
import { pool } from "../db";
import { authMiddleware } from "../middleware/auth-middleware";
import { roleMiddleware } from "../middleware/role-middleware";
import { USER_ROLES } from "@shared/constants";

const router = Router();

const organizationRepository = new OrganizationRepository(pool);
const organizationService = new OrganizationService(organizationRepository);
const organizationController = new OrganizationController(organizationService);

router.get("/", authMiddleware, organizationController.getAll);
router.get("/search", authMiddleware, organizationController.search);
router.get("/:id", authMiddleware, organizationController.getById);
router.post(
  "/",
  authMiddleware,
  roleMiddleware([USER_ROLES.SUPER_ADMIN]),
  organizationController.create,
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware([USER_ROLES.SUPER_ADMIN]),
  organizationController.update,
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware([USER_ROLES.SUPER_ADMIN]),
  organizationController.delete,
);

export { router as organizationsRouter };
