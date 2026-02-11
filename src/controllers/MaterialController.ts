import { Request, Response } from "express";
import { baseErrorHandling } from "../utils/errors.utils";
import { MaterialService } from "../services";
import { CreateMaterialDTO, UpdateMaterialDTO } from "../dto";
import { Pool } from "pg";

export class MaterialController {
  private _materialService: MaterialService;

  constructor(dbConnection: Pool) {
    this._materialService = new MaterialService(dbConnection);
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

  async findById(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);

      // Добавляем проверку ID
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid material ID" });
      }

      const material = await this._materialService.findById(id);
      res.status(200).json({
        data: material,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async create(req: Request<{}, {}, CreateMaterialDTO>, res: Response) {
    try {
      const { name } = req.body;

      // Проверка тела запроса
      if (!name || name.trim() === "") {
        return res.status(400).json({ error: "Material name is required" });
      }

      // Добавляем await (метод сервиса асинхронный)
      const result = await this._materialService.create({ name });

      // Исправляем: 201 статус для создания, а не 200
      res.status(201).json({
        data: result,
        message: "Material created successfully",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);

      // Добавляем проверку ID
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid material ID" });
      }

      const deletedMaterial = await this._materialService.delete(id);
      res.status(200).json({
        data: deletedMaterial,
        message: "Material deleted successfully",
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

      // Проверка ID
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid material ID" });
      }

      // Проверка, что есть что обновлять
      if (!name || name.trim() === "") {
        return res.status(400).json({ error: "Material name cannot be empty" });
      }

      const updatedMaterial = await this._materialService.update({
        id,
        name,
      });

      // Исправляем: 200 статус для обновления, а не 201
      res.status(200).json({
        data: updatedMaterial,
        message: "Material updated successfully",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async search(req: Request<{ search: string }, {}, {}>, res: Response) {
    try {
      const { search } = req.params;

      // Проверка search параметра
      if (!search || search.trim() === "") {
        return res.status(400).json({ error: "Search query is required" });
      }

      const searchedMaterials = await this._materialService.search(search);

      // Исправляем: res.status(200).json() вместо res.send(200).json()
      res.status(200).json({
        data: searchedMaterials,
        message: `Found ${searchedMaterials.length} material(s)`,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
