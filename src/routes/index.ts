import { Router } from "express";
import { materialsRouter } from "./materials.route";
import organizationsRouter from "./organizations.route";
import usersRouter from "./users.route";
import warehousesRouter from "./warehouses.route";
import agreementsRouter from "./agreements.route";

const router = Router();

router.use("/materials", materialsRouter);
router.use("/organizations", organizationsRouter);
router.use("/users", usersRouter);
router.use("/warehouses", warehousesRouter);
router.use("/agreements", agreementsRouter);

export default router;
