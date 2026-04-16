import { Router } from "express";
import { Material3DController } from "../controllers/Material3DController";
import { pool } from "../db";
import { upload } from "../middleware/upload";

export const material3DRouter = Router();
const material3DController = new Material3DController(pool);

material3DRouter.get("/:id", (req, res) => {
  material3DController.findById(req, res);
});

material3DRouter.get("/material/:id", (req, res) => {
  material3DController.findByMaterialId(req, res);
});

material3DRouter.post("/", upload.single("model_data"), (req, res) => {
  material3DController.create(req, res);
});

material3DRouter.patch("/", upload.single("model_data"), (req, res) => {
  material3DController.update(req, res);
});

material3DRouter.delete("/:id", (req, res) => {
  material3DController.delete(req, res);
});
