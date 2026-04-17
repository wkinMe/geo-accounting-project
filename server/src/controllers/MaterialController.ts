import { Request, Response } from "express";
import { Pool } from "pg";
import { MaterialService } from "@src/services";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@shared/constants";
import { baseErrorHandling } from "@src/utils";

export class MaterialController {
  private _materialService: MaterialService;
  private _entityName = "Material";

  constructor(pool: Pool) {
    this._materialService = new MaterialService(pool);
  }

  async findAll(req: Request, res: Response) {
    try {
      const materials = await this._materialService.findAll();
      res.status(200).json({
        data: materials,
        message: SUCCESS_MESSAGES.FIND_ALL(this._entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findById(req: Request<{ id: string }>, res: Response) {
    try {
      const id = this.validateId(req.params.id, res);
      if (!id) return;

      const material = await this._materialService.findById(id);
      res.status(200).json({
        data: material,
        message: SUCCESS_MESSAGES.FIND_BY_ID(this._entityName, id),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async search(req: Request, res: Response) {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string" || q.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.SEARCH_QUERY_REQUIRED,
        });
      }

      const materials = await this._materialService.search(q);
      res.status(200).json({
        data: materials,
        message: SUCCESS_MESSAGES.SEARCH(this._entityName, materials.length),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, unit } = req.body;
      const image = req.file?.buffer;

      if (!name?.trim()) {
        return res.status(400).json({
          message: ERROR_MESSAGES.EMPTY_FIELD("Material name"),
        });
      }

      if (!unit?.trim()) {
        return res.status(400).json({
          message: ERROR_MESSAGES.EMPTY_FIELD("Material unit"),
        });
      }

      const newMaterial = await this._materialService.create({
        name: name.trim(),
        unit: unit.trim(),
        image: image || null,
      });

      res.status(201).json({
        data: newMaterial,
        message: SUCCESS_MESSAGES.CREATE(this._entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async update(req: Request<{ id: string }>, res: Response) {
    try {
      const id = this.validateId(req.params.id, res);
      if (!id) return;

      const { name, unit } = req.body;
      const image = req.file?.buffer;
      const removeImage = req.body.remove_image === "true";

      const updateData: any = {};
      if (name !== undefined) updateData.name = name?.trim();
      if (unit !== undefined) updateData.unit = unit?.trim();

      if (image) {
        updateData.image = image;
      } else if (removeImage) {
        updateData.image = null;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.UPDATE_DATA_REQUIRED,
        });
      }

      const updatedMaterial = await this._materialService.update(
        id,
        updateData,
      );

      res.status(200).json({
        data: updatedMaterial,
        message: SUCCESS_MESSAGES.UPDATE(this._entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    try {
      const id = this.validateId(req.params.id, res);
      if (!id) return;

      await this._materialService.delete(id);

      res.status(200).json({
        message: SUCCESS_MESSAGES.DELETE(this._entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async getImage(req: Request<{ id: string }>, res: Response) {
    try {
      const id = this.validateId(req.params.id, res);
      if (!id) return;

      const image = await this._materialService.getImage(id);

      if (!image) {
        return res.status(404).json({
          message: ERROR_MESSAGES.NOT_FOUND("Image", id),
        });
      }

      res.setHeader("Content-Type", "image/jpeg");
      res.send(image);
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async upsertImage(req: Request<{ id: string }>, res: Response) {
    try {
      const id = this.validateId(req.params.id, res);
      if (!id) return;

      const image = req.file?.buffer;

      if (!image || image.length === 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.EMPTY_FIELD("Image"),
        });
      }

      await this._materialService.upsertImage(id, image);

      res.status(200).json({
        message: SUCCESS_MESSAGES.UPDATE(`${this._entityName} image`),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async deleteImage(req: Request<{ id: string }>, res: Response) {
    try {
      const id = this.validateId(req.params.id, res);
      if (!id) return;

      await this._materialService.deleteImage(id);

      res.status(200).json({
        message: SUCCESS_MESSAGES.DELETE(`${this._entityName} image`),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  private validateId(idStr: string, res: Response): number | null {
    const id = parseInt(idStr);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        message: ERROR_MESSAGES.INVALID_ID_FORMAT(this._entityName),
      });
      return null;
    }
    return id;
  }
}
