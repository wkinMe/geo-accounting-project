import { MaterialController } from "@src/controllers";
import { pool } from "@src/db";
import { Router } from "express";
import { Request, Response } from "express";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const materialsRouter = Router();
const materialController = new MaterialController(pool);

// Основные CRUD
materialsRouter.get("/", (req: Request, res: Response) =>
  materialController.findAll(req, res),
);
materialsRouter.get("/search", (req: Request, res: Response) =>
  materialController.search(req, res),
);
materialsRouter.get("/:id", (req: Request<{ id: string }>, res: Response) =>
  materialController.findById(req, res),
);
materialsRouter.post(
  "/",
  upload.single("image"),
  (req: Request, res: Response) => materialController.create(req, res),
);
materialsRouter.patch(
  "/:id",
  upload.single("image"),
  (req: Request<{ id: string }>, res: Response) =>
    materialController.update(req, res),
);
materialsRouter.delete("/:id", (req: Request<{ id: string }>, res: Response) =>
  materialController.delete(req, res),
);

// Работа с изображениями (один материал = одно изображение)
materialsRouter.get(
  "/:id/image",
  (req: Request<{ id: string }>, res: Response) =>
    materialController.getImage(req, res),
);

materialsRouter.put(
  "/:id/image",
  upload.single("image"),
  (req: Request<{ id: string }>, res: Response) =>
    materialController.upsertImage(req, res),
);

materialsRouter.delete(
  "/:id/image",
  (req: Request<{ id: string }>, res: Response) =>
    materialController.deleteImage(req, res),
);
