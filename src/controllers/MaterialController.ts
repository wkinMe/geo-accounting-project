import { Request, Response } from "express";
import { baseErrorHandling } from "../utils/errors.utils";
import { MaterialService } from "../services";
import { UpdateMaterialDTO } from "../dto";

export class MaterialController {
  private _materialService: MaterialService;

  constructor(service: MaterialService) {
    this._materialService = service;
  }

  async findAll(req: Request, res: Response) {
    try {
      const materials = await this._materialService.findAll();

      res.status(200).json({
        data: materials,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const material = await this._materialService.findById(
        Number(req.params.id),
      );

      res.status(200).json({
        data: material,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deletedMaterial = await this._materialService.delete(
        Number(req.params.id),
      );

      res.status(200).json({
        data: deletedMaterial,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async update(
    req: Request<{ id: number }, {}, Omit<UpdateMaterialDTO, "id">>,
    res: Response,
  ) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const updatedMaterial = await this._materialService.update({
        id,
        name,
      });

      res.json(201).json({
        data: updatedMaterial,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async search(req: Request<{ search: string }, {}, {}>, res: Response) {
    try {
      const { search } = req.params;

      const searchedMaterials = await this._materialService.search(search);

      res.send(200).json({
        data: searchedMaterials,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
