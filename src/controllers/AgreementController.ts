import { Request, Response } from "express";
import { AgreementService } from "../services";
import { baseErrorHandling } from "../utils/errors.utils";
import { AgreementUpdateParams } from "../types/services";
import { Pool } from "pg";

export class AgreementController {
  private _agreementService: AgreementService;

  constructor(dbConnection: Pool) {
    this._agreementService = new AgreementService(dbConnection);
  }

  async findAll(req: Request, res: Response) {
    try {
      const agreements = await this._agreementService.findAll();

      res.status(200).json({
        data: agreements,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findById(req: Request<{id: string}, {}, {}>, res: Response) {
    try {
      const id = Number(req.params.id)
      const agreement = await this._agreementService.findById(id);

      res.status(200).json({
        data: agreement,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deletedAgreement = await this._agreementService.delete(
        Number(req.params.id),
      );

      res.status(200).json({
        data: deletedAgreement,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async update(req: Request<{}, {}, AgreementUpdateParams>, res: Response) {
    try {
      const { id, updateData, materials } = req.body;

      const updatedAgreement = await this._agreementService.update({
        id,
        updateData,
        materials,
      });

      res.json(201).json({
        data: updatedAgreement,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async search(req: Request<{ search: string }, {}, {}>, res: Response) {
    try {
      const { search } = req.params;

      const searchedAgreements = await this._agreementService.search(search);

      res.send(200).json({
        data: searchedAgreements,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
