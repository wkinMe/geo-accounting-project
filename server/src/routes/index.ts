// routes/index.ts
import { Router } from "express";
import { materialsRouter } from "./materials.route";
import { organizationsRouter } from "./organizations.route";
import { warehousesRouter } from "./warehouses.route";
import { inventoryRouter } from "./inventory.route";
import { agreementsRouter } from "./agreements.route";
import { warehouseHistoryRouter } from "./warehouseHistory.route";
import usersRouter from "./users.route";

const router = Router();

router.use("/materials", materialsRouter);
router.use("/organizations", organizationsRouter);
router.use("/users", usersRouter);
router.use("/warehouses", warehousesRouter);
router.use("/inventory", inventoryRouter);
router.use("/agreements", agreementsRouter);
router.use("/warehouse-history", warehouseHistoryRouter);

export default router;
