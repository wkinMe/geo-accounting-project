import { CreateOrganizationDTO, UpdateOrganizationDTO } from "@src/dto";
import { OrganizationService } from "@src/services";
import { baseErrorHandling } from "@src/utils";
import { Request, Response } from "express";
import { Pool } from "pg";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@src/constants/messages";

export class OrganizationController {
  private _organizationService: OrganizationService;
  private entityName = "organization";

  constructor(dbConnection: Pool) {
    this._organizationService = new OrganizationService(dbConnection);
  }

  async findAll(req: Request, res: Response) {
    try {
      const organizations = await this._organizationService.findAll();
      res.status(200).json({
        data: organizations,
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

      const organization = await this._organizationService.findById(id);
      res.status(200).json({
        data: organization,
        message: SUCCESS_MESSAGES.FIND_BY_ID(this.entityName, id),
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

      const deletedOrganization = await this._organizationService.delete(id);
      res.status(200).json({
        data: deletedOrganization,
        message: SUCCESS_MESSAGES.DELETE(this.entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async create(req: Request<{}, {}, CreateOrganizationDTO>, res: Response) {
    try {
      const createData = req.body;

      if (!createData || typeof createData !== "object") {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUEST_BODY_REQUIRED,
        });
      }

      if (!createData.name || createData.name.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUIRED_FIELD("Organization name"),
        });
      }

      const createdOrganization =
        await this._organizationService.create(createData);

      res.status(201).json({
        data: createdOrganization,
        message: SUCCESS_MESSAGES.CREATE(this.entityName),
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
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT(this.entityName),
        });
      }

      const updateData = { name, manager_id, latitude, longitude };
      if (Object.values(updateData).every((value) => value === undefined)) {
        return res.status(400).json({
          message: ERROR_MESSAGES.UPDATE_DATA_REQUIRED,
        });
      }

      if (name !== undefined && name.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.EMPTY_FIELD("Organization name"),
        });
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

      const searchedOrganizations = await this._organizationService.search(q);

      res.status(200).json({
        data: searchedOrganizations,
        message: SUCCESS_MESSAGES.SEARCH(
          this.entityName,
          searchedOrganizations.length,
        ),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
