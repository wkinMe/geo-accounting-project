// server/src/routes/materials.route.ts
import { Router } from "express";
import multer from "multer";
import { MaterialController } from "../controllers/MaterialController";
import { MaterialService } from "../services/MaterialService";
import { MaterialRepository } from "../repositories/MaterialRepository";
import { MaterialImageRepository } from "../repositories/MaterialImageRepository";
import { pool } from "../db";

const upload = multer({ storage: multer.memoryStorage() });
const materialsRouter = Router();

// Инициализация зависимостей
const materialRepository = new MaterialRepository(pool);
const imageRepository = new MaterialImageRepository(pool);
const materialService = new MaterialService(
  materialRepository,
  imageRepository,
);
const materialController = new MaterialController(materialService);

// CRUD
materialsRouter.get("/", materialController.getAll);
materialsRouter.get("/search", materialController.search);
materialsRouter.get("/:id", materialController.getById);
materialsRouter.post("/", upload.single("image"), materialController.create); // 👈 Добавляем поддержку файла
materialsRouter.put("/:id", upload.single("image"), materialController.update); // 👈 МЕНЯЕМ на single
materialsRouter.delete("/:id", materialController.delete);

// Image endpoints
materialsRouter.get("/:id/image", materialController.getImage);
materialsRouter.post(
  "/:id/image",
  upload.single("image"),
  materialController.uploadImage,
);
materialsRouter.delete("/:id/image", materialController.deleteImage);

export { materialsRouter };
