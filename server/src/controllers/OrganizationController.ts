// controllers/OrganizationController.ts
import { Request, Response } from "express";
import { OrganizationService } from "../services/OrganizationService";
import { CreateOrganizationDTO, UpdateOrganizationDTO } from "@shared/dto";
import { ValidationError, NotFoundError } from "@shared/service";

export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  getAll = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as "ASC" | "DESC" | undefined;

      const result = await this.organizationService.findAll(
        limit,
        offset,
        sortBy,
        sortOrder,
      );

      res.json({
        success: true,
        data: result.data.map((o) => o.toJSON()),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      const organization = await this.organizationService.findById(id);

      res.json({
        success: true,
        data: organization.toJSON(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const dto: CreateOrganizationDTO = req.body;
      const organization = await this.organizationService.create(dto);

      res.status(201).json({
        success: true,
        data: organization.toJSON(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      const dto: UpdateOrganizationDTO = req.body;
      const organization = await this.organizationService.update(id, dto);

      res.json({
        success: true,
        data: organization.toJSON(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = this.parseId(req.params.id);
      await this.organizationService.delete(id);

      res.json({
        success: true,
        message: "Организация успешно удалена",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  search = async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as "ASC" | "DESC" | undefined;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          error: "Параметр поиска 'q' обязателен",
        });
      }

      const result = await this.organizationService.search(
        q,
        limit,
        offset,
        sortBy,
        sortOrder,
      );

      res.json({
        success: true,
        data: result.data.map((o) => o.toJSON()),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
        query: q,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private parseId(idParam: string | string[] | undefined): number {
    if (!idParam) {
      throw new ValidationError(
        "ID параметр обязателен",
        "parseId",
        "id",
        "undefined",
      );
    }

    const idString = Array.isArray(idParam) ? idParam[0] : idParam;
    const id = parseInt(idString, 10);

    if (isNaN(id)) {
      throw new ValidationError(
        "Неверный формат ID",
        "parseId",
        "id",
        idString,
      );
    }

    return id;
  }

  private handleError(error: unknown, res: Response): void {
    console.error("OrganizationController error:", error);

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
      res.status(500).json({
        success: false,
        error: "Внутренняя ошибка сервера",
      });
    }
  }
}
