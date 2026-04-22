// controllers/MaterialController.ts
import { Request, Response } from "express";
import { MaterialService } from "../services/MaterialService";
import { CreateMaterialDTO, UpdateMaterialDTO } from "@shared/dto";
import { ValidationError, NotFoundError } from "@shared/service";

export class MaterialController {
  constructor(private materialService: MaterialService) {}

  getAll = async (req: Request, res: Response) => {
    try {
      const materials = await this.materialService.findAll();

      res.json({
        success: true,
        data: materials.map((m) => m.toJSON()),
        count: materials.length,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      const material = await this.materialService.findById(id);

      res.json({
        success: true,
        data: material.toJSON(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const dto: CreateMaterialDTO = {
        name: req.body.name,
        unit: req.body.unit,
        image: req.file ? req.file.buffer : undefined,
      };

      const material = await this.materialService.create(dto);

      res.status(201).json({
        success: true,
        data: material.toJSON(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);

      const dto: UpdateMaterialDTO = {
        name: req.body.name,
        unit: req.body.unit,
      };

      // Обработка изображения
      if (req.file) {
        // Если есть файл - обновляем изображение
        dto.image = req.file.buffer;
      } else if (req.body.image === "null") {
        // Если явно передали null - удаляем изображение
        dto.image = null;
      }
      // Если image нет в запросе - не трогаем изображение

      const material = await this.materialService.update(id, dto);

      res.json({
        success: true,
        data: material.toJSON(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      await this.materialService.delete(id);

      res.json({
        success: true,
        message: "Material deleted successfully",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  search = async (req: Request, res: Response) => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          error: "Search query parameter 'q' is required",
        });
      }

      const materials = await this.materialService.search(q);

      res.json({
        success: true,
        data: materials.map((m) => m.toJSON()),
        count: materials.length,
        query: q,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // Image endpoints
  getImage = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      const image = await this.materialService.getImage(id);

      if (!image) {
        return res.status(404).json({
          success: false,
          error: "Image not found",
        });
      }

      res.setHeader("Content-Type", "image/jpeg");
      res.send(image);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  uploadImage = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No image file provided",
        });
      }

      await this.materialService.upsertImage(id, req.file.buffer);

      res.json({
        success: true,
        message: "Image uploaded successfully",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  deleteImage = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      await this.materialService.deleteImage(id);

      res.json({
        success: true,
        message: "Image deleted successfully",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // ========== Private helpers ==========
  private parseId(idParam: string | string[] | undefined): number {
    if (!idParam) {
      throw new ValidationError(
        "ID parameter is required",
        "parseId",
        "id",
        "undefined",
      );
    }

    const idString = Array.isArray(idParam) ? idParam[0] : idParam;
    const id = parseInt(idString, 10);

    if (isNaN(id)) {
      throw new ValidationError("Invalid ID format", "parseId", "id", idString);
    }

    return id;
  }

  private handleError(error: unknown, res: Response): void {
    console.error("MaterialController error:", error);

    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
        field: error.field,
        operation: error.operation,
      });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error("Unhandled error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
