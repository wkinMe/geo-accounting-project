import { Pool } from "pg";
import { Request, Response } from "express";
import { Material3DService } from "../services/Material3DService";
import { baseErrorHandling } from "../utils";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@shared/constants";
import {
  CreateMaterial3DObjectDTO,
  UpdateMaterial3DObjectDTO,
} from "@shared/dto";

export class Material3DController {
  private _material3DService: Material3DService;
  private _entityName = "material 3d object";

  constructor(dbConnection: Pool) {
    this._material3DService = new Material3DService(dbConnection);
  }

  async findById(req: Request<{ id: string }>, res: Response) {
    const id = Number(req.params.id);

    try {
      const object = this._material3DService.findById(id);

      res.status(200).json({
        data: object,
        message: SUCCESS_MESSAGES.FIND_BY_ID(this._entityName, id),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findByMaterialId(req: Request<{ id: string }>, res: Response) {
    const id = Number(req.params.id);

    try {
      const object = await this._material3DService.findByMaterialId(id);

      // Если объект не найден, возвращаем null без ошибки
      if (!object) {
        return res.status(200).json({
          data: null,
          message: `No 3D object found for material with id=${id}`,
        });
      }

      res.status(200).json({
        data: object,
        message: `3D object of material with id=${id} has been retrieved`,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { material_id, format } = req.body;
      const model_data = req.file?.buffer;

      if (!model_data) {
        return res.status(400).json({ error: "Файл 3D объекта обязателен" });
      }

      const result = await this._material3DService.create({
        material_id: Number(material_id),
        format,
        model_data,
      });

      res.status(201).json(result);
    } catch (error) {
      console.error("Error in create:", error);
      res.status(500).json({ error: "Failed to create 3D object" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { material_id, format } = req.body;
      const model_data = req.file?.buffer;

      if (!material_id) {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUIRED_FIELD("material_id"),
        });
      }

      if (!format) {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUIRED_FIELD("format"),
        });
      }

      if (!model_data) {
        return res.status(400).json({ error: "Файл 3D объекта обязателен" });
      }

      const result = await this._material3DService.update({
        material_id: Number(material_id),
        format,
        model_data,
      });

      res.status(200).json({
        data: result,
        message: SUCCESS_MESSAGES.UPDATE(this._entityName),
      });
    } catch (error) {
      console.error("Error in update:", error);
      baseErrorHandling(error, res);
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    const material_id = Number(req.params.id);

    try {
      await this._material3DService.delete(material_id);

      res.status(200).json({
        message: SUCCESS_MESSAGES.DELETE(this._entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
