// routes/material3d.routes.ts
import { Router } from "express";
import multer from "multer";
import { Material3DController } from "../controllers/Material3DController";
import { Material3DService } from "../services/Material3DService";
import { Material3DRepository } from "../repositories/Material3DRepository";
import { MaterialRepository } from "../repositories/MaterialRepository";
import { pool } from "../db";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

const router = Router();

// Инициализация зависимостей
const material3DRepo = new Material3DRepository(pool);
const materialRepo = new MaterialRepository(pool);
const material3DService = new Material3DService(material3DRepo, materialRepo);
const material3DController = new Material3DController(material3DService);

// GET endpoints
router.get("/material/:materialId", material3DController.getByMaterialId);
router.get(
  "/material/:materialId/download",
  material3DController.downloadModel,
);

// POST/PUT/DELETE
router.post("/", upload.single("model"), material3DController.create);
router.put(
  "/material/:materialId",
  upload.single("model"),
  material3DController.update,
);
router.delete("/material/:materialId", material3DController.delete);

export { router as material3DRouter };
