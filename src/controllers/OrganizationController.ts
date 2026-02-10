import { Request, Response } from "express";
import { OrganizationService } from "../services";
import { baseErrorHandling } from "../utils/errors.utils";
import { UpdateOrganizationDTO } from "../dto";

export class OrganizationController {
  private _organizationService: OrganizationService;

  constructor(service: OrganizationService) {
    this._organizationService = service;
  }

  async findAll(req: Request, res: Response) {
    try {
      const organizations = this._organizationService.findAll();

      res.status(200).json({
        data: organizations,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const organization = this._organizationService.findById(
        Number(req.params.id),
      );

      res.status(200).json({
        data: organization,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deletedOrganization = this._organizationService.delete(
        Number(req.params.id),
      );

      res.status(200).json({
        data: deletedOrganization,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async update(
    req: Request<{ id: number }, {}, Omit<UpdateOrganizationDTO, "id">>,
    res: Response,
  ) {
    try {
      const { id } = req.params;
      const { name, manager_id, latitude, longitude } = req.body;

      const updatedOrganization = this._organizationService.update({
        id,
        name,
        manager_id,
        latitude,
        longitude,
      });

      res.json(201).json({
        data: updatedOrganization,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async search(req: Request<{ search: string }, {}, {}>, res: Response) {
    try {
      const { search } = req.params;

      const searchedOrganizations = this._organizationService.search(search);

      res.send(200).json({
        data: searchedOrganizations,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
