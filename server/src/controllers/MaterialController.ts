import { CreateMaterialDTO, UpdateMaterialDTO } from "@shared/dto";
import { MaterialService } from "@src/services";
import { baseErrorHandling } from "@src/utils";
import { Request, Response } from "express";
import { Pool } from "pg";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@shared/constants";

export class MaterialController {
  private _materialService: MaterialService;
  private entityName = "material";

  constructor(dbConnection: Pool) {
    this._materialService = new MaterialService(dbConnection);
  }

  async findAll(req: Request, res: Response) {
    try {
      const materials = await this._materialService.findAll();
      res.status(200).json({
        data: materials,
        message: SUCCESS_MESSAGES.FIND_ALL(this.entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findById(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT(this.entityName),
        });
      }

      const material = await this._materialService.findById(id);
      res.status(200).json({
        data: material,
        message: SUCCESS_MESSAGES.FIND_BY_ID(this.entityName, id),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async create(req: Request<{}, {}, CreateMaterialDTO>, res: Response) {
    try {
      const { name } = req.body;

      if (!name || name.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUIRED_FIELD("Material name"),
        });
      }

      const result = await this._materialService.create({ name });

      res.status(201).json({
        data: result,
        message: SUCCESS_MESSAGES.CREATE(this.entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT(this.entityName),
        });
      }

      const deletedMaterial = await this._materialService.delete(id);
      res.status(200).json({
        data: deletedMaterial,
        message: SUCCESS_MESSAGES.DELETE(this.entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async update(
    req: Request<{ id: string }, {}, Omit<UpdateMaterialDTO, "id">>,
    res: Response,
  ) {
    try {
      const id = Number(req.params.id);
      const { name } = req.body;

      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT(this.entityName),
        });
      }

      if (!name || name.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.EMPTY_FIELD("Material name"),
        });
      }

      const updatedMaterial = await this._materialService.update({
        id,
        name,
      });

      res.status(200).json({
        data: updatedMaterial,
        message: SUCCESS_MESSAGES.UPDATE(this.entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async search(req: Request<{}, {}, {}, { q?: string }>, res: Response) {
    try {
      const { q } = req.query;

      if (!q || q.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.SEARCH_QUERY_REQUIRED,
        });
      }

      const searchedMaterials = await this._materialService.search(q);

      res.status(200).json({
        data: searchedMaterials,
        message: SUCCESS_MESSAGES.SEARCH(
          this.entityName,
          searchedMaterials.length,
        ),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
