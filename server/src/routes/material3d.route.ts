import { Router } from "express";
import { Material3DController } from "../controllers/Material3DController";
import { pool } from "../db";
import { Request, Response } from "express";
import {
  CreateMaterial3DObjectDTO,
  UpdateMaterial3DObjectDTO,
} from "@shared/dto";
import { upload } from "../middleware/upload";

export const material3DRouter = Router();
const material3DController = new Material3DController(pool);

material3DRouter.get("/:id", (req: Request<{ id: string }>, res: Response) => {
  material3DController.findById(req, res);
});

material3DRouter.get(
  "/material/:id",
  (req: Request<{ id: string }>, res: Response) => {
    material3DController.findByMaterialId(req, res);
  },
);
material3DRouter.post(
  "/",
  upload.single("model_data"),
  (req: Request, res: Response) => {
    material3DController.create(req, res);
  },
);

material3DRouter.patch(
  `/`,
  (req: Request<{}, {}, UpdateMaterial3DObjectDTO>, res: Response) => {
    material3DController.update(req, res);
  },
);
