// routes/organizations.route.ts
import { Router } from "express";
import { OrganizationController } from "../controllers/OrganizationController";
import { OrganizationService } from "../services/OrganizationService";
import { OrganizationRepository } from "../repositories/OrganizationRepository";
import { pool } from "../db";

const router = Router();

const organizationRepository = new OrganizationRepository(pool);
const organizationService = new OrganizationService(organizationRepository);
const organizationController = new OrganizationController(organizationService);

router.get("/", organizationController.getAll);
router.get("/search", organizationController.search);
router.get("/:id", organizationController.getById);
router.post("/", organizationController.create);
router.put("/:id", organizationController.update);
router.delete("/:id", organizationController.delete);

export { router as organizationsRouter };
