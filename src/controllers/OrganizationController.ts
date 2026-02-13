import { CreateOrganizationDTO, UpdateOrganizationDTO } from "@src/dto";
import { OrganizationService } from "@src/services";
import { baseErrorHandling } from "@src/utils";
import { Request, Response } from "express";

export class OrganizationController {
  private _organizationService: OrganizationService;

  constructor(service: OrganizationService) {
    this._organizationService = service;
  }

  async findAll(req: Request, res: Response) {
    try {
      const organizations = await this._organizationService.findAll();

      res.status(200).json({
        data: organizations,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findById(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const organization = await this._organizationService.findById(id);

      res.status(200).json({
        data: organization,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const deletedOrganization = await this._organizationService.delete(id);

      res.status(200).json({
        data: deletedOrganization,
        message: "Organization deleted successfully",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async create(req: Request<{}, {}, CreateOrganizationDTO>, res: Response) {
    try {
      const createData = req.body;

      // Проверка тела запроса
      if (!createData || typeof createData !== "object") {
        return res.status(400).json({ error: "Request body is required" });
      }

      // Проверка обязательного поля name
      if (!createData.name || createData.name.trim() === "") {
        return res.status(400).json({ error: "Organization name is required" });
      }

      const createdOrganization =
        await this._organizationService.create(createData);

      res.status(201).json({
        data: createdOrganization,
        message: "Organization created successfully",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async update(
    req: Request<{ id: string }, {}, Omit<UpdateOrganizationDTO, "id">>,
    res: Response,
  ) {
    try {
      const { id } = req.params;
      const { name, manager_id, latitude, longitude } = req.body;

      const numId = Number(id);

      if (isNaN(numId) || numId <= 0) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      // Проверка, что есть что обновлять
      const updateData = { name, manager_id, latitude, longitude };
      if (Object.values(updateData).every((value) => value === undefined)) {
        return res.status(400).json({ error: "Update data is required" });
      }

      // Проверка имени, если оно пришло
      if (name !== undefined && name.trim() === "") {
        return res
          .status(400)
          .json({ error: "Organization name cannot be empty" });
      }

      const updatedOrganization = await this._organizationService.update({
        id: numId,
        name,
        manager_id,
        latitude,
        longitude,
      });

      res.status(200).json({
        data: updatedOrganization,
        message: "Organization updated successfully",
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

      const searchedOrganizations =
        await this._organizationService.search(search);

      res.status(200).json({
        data: searchedOrganizations,
        message: `Found ${searchedOrganizations.length} organization(s)`,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
