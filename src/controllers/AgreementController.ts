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
      const agreements = this._agreementService.findAll();

      res.status(200).json({
        data: agreements,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const agreement = this._agreementService.findById(Number(req.params.id));

      res.status(200).json({
        data: agreement,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deletedAgreement = this._agreementService.delete(
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

      const updatedAgreement = this._agreementService.update({
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

      const searchedAgreements = this._agreementService.search(search);

      res.send(200).json({
        data: searchedAgreements,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
