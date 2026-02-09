import { Request, Response } from "express";
import { MaterialService } from "../services";
import { baseErrorHandling } from "../utils/errors.utils";

export class MaterialController {
  private _materialService: MaterialService;

  constructor(service: MaterialService) {
    this._materialService = service;
  }

  async findAll(req: Request, res: Response) {
    try {
      const materials = await this._materialService.findAll();
  
      res.send(200).json({
        data: materials
      })

    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const material = this._materialService.findById(id);
  
      res.json(200).json({
        data: material,
      })
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async 
}