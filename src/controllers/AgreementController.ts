import { AgreementService } from "@src/services";
import { Pool } from "pg";
import { Request, Response } from "express";
import { baseErrorHandling } from "@src/utils";
import { AgreementCreateParams, AgreementUpdateParams } from "@t/services";

export class AgreementController {
  private _agreementService: AgreementService;

  constructor(dbConnection: Pool) {
    this._agreementService = new AgreementService(dbConnection);
  }

  async findAll(req: Request, res: Response) {
    try {
      const agreements = await this._agreementService.findAll();
      res.status(200).json({ data: agreements });
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

      const agreement = await this._agreementService.findById(id);
      res.status(200).json({ data: agreement });
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

      const deletedAgreement = await this._agreementService.delete(id);
      res.status(200).json({
        data: deletedAgreement,
        message: "Agreement deleted successfully",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async create(req: Request<{}, {}, AgreementCreateParams>, res: Response) {
    try {
      const { createData, materials } = req.body;

      // Базовая проверка тела запроса
      if (!createData || typeof createData !== "object") {
        return res.status(400).json({ error: "Request body is required" });
      }

      if (!createData.status || createData.status.trim() === "") {
        return res.status(400).json({ error: "Status is required" });
      }

      if (!createData.supplier_warehouse_id) {
        return res
          .status(400)
          .json({ error: "Supplier warehouse ID is required" });
      }

      if (!createData.customer_warehouse_id) {
        return res
          .status(400)
          .json({ error: "Customer warehouse ID is required" });
      }

      const createdAgreement = await this._agreementService.create({
        createData,
        materials,
      });
      res.status(201).json({
        data: createdAgreement,
        message: "Agreement created successfully",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async update(
    req: Request<{ id: string }, {}, AgreementUpdateParams>,
    res: Response,
  ) {
    try {
      const id = Number(req.params.id);

      const { updateData, materials } = req.body;

      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      // Проверка, что есть что обновлять
      if (
        !updateData ||
        typeof updateData !== "object" ||
        Object.keys(updateData).length === 0
      ) {
        return res.status(400).json({ error: "Update data is required" });
      }

      // Проверка статуса, если он пришел
      if (updateData.status !== undefined && updateData.status.trim() === "") {
        return res.status(400).json({ error: "Status cannot be empty" });
      }

      const updatedAgreement = await this._agreementService.update({
        id,
        updateData,
        materials,
      });
      res.status(200).json({
        data: updatedAgreement,
        message: "Agreement updated successfully",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async search(req: Request<{}, {}, {}, { q?: string }>, res: Response) {
    try {
      const searchQuery = req.query.q;

      // Проверка query параметра
      if (!searchQuery || searchQuery.trim() === "") {
        return res.status(400).json({ error: "Search query is required" });
      }

      const searchedAgreements =
        await this._agreementService.search(searchQuery);
      res.status(200).json({
        data: searchedAgreements,
        message: `Found ${searchedAgreements.length} agreement(s)`,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
