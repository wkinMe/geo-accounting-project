// controllers/Material3DController.ts
import { Request, Response } from "express";
import { Material3DService } from "../services/Material3DService";
import { CreateMaterial3DDTO, UpdateMaterial3DDTO } from "@shared/dto";
import { ValidationError, NotFoundError } from "@shared/service";

export class Material3DController {
  constructor(private material3DService: Material3DService) {}

  getByMaterialId = async (req: Request, res: Response) => {
    try {
      const materialId = this.parseId(req.params.materialId);
      const material3D =
        await this.material3DService.findByMaterialId(materialId);

      if (!material3D) {
        return res.status(404).json({
          success: false,
          error: `3D object for material ${materialId} not found`,
        });
      }

      res.json({
        success: true,
        data: material3D.toJSON(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const dto: CreateMaterial3DDTO = {
        materialId: parseInt(req.body.materialId),
        format: req.body.format,
        modelData: req.file?.buffer,
      };

      const material3D = await this.material3DService.create(dto);

      res.status(201).json({
        success: true,
        data: material3D.toJSON(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const materialId = this.parseId(req.params.materialId);

      const dto: UpdateMaterial3DDTO = {};

      if (req.body.format) {
        dto.format = req.body.format;
      }

      if (req.file) {
        dto.modelData = req.file.buffer;
      }

      const material3D = await this.material3DService.update(materialId, dto);

      res.json({
        success: true,
        data: material3D.toJSON(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const materialId = this.parseId(req.params.materialId);
      await this.material3DService.delete(materialId);

      res.json({
        success: true,
        message: "3D object deleted successfully",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  downloadModel = async (req: Request, res: Response) => {
    try {
      const materialId = this.parseId(req.params.materialId);
      const modelData = await this.material3DService.getModelData(materialId);

      if (!modelData) {
        return res.status(404).json({
          success: false,
          error: "3D model not found",
        });
      }

      // Определяем MIME тип по формату
      const material3D =
        await this.material3DService.findByMaterialId(materialId);
      const mimeType = this.getMimeType(material3D?.format || "gltf");

      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="model.${material3D?.format}"`,
      );
      res.send(modelData);
    } catch (error) {
      this.handleError(error, res);
    }
  };

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

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      gltf: "model/gltf+json",
      glb: "model/gltf-binary",
      obj: "text/plain",
      fbx: "application/octet-stream",
      stl: "application/sla",
    };
    return mimeTypes[format.toLowerCase()] || "application/octet-stream";
  }

  private handleError(error: unknown, res: Response): void {
    console.error("Material3DController error:", error);

    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
        field: error.field,
      });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
