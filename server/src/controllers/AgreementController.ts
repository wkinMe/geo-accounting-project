import { AgreementService } from "@src/services";
import { Pool } from "pg";
import { Request, Response } from "express";
import { baseErrorHandling } from "@src/utils";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@shared/constants";
import { AgreementCreateParams, AgreementUpdateParams } from "@shared/types";

export class AgreementController {
  private _agreementService: AgreementService;
  private entityName = "agreement";

  constructor(dbConnection: Pool) {
    this._agreementService = new AgreementService(dbConnection);
  }

  async findAll(req: Request, res: Response) {
    try {
      const agreements = await this._agreementService.findAll();
      res.status(200).json({
        data: agreements,
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

      const agreement = await this._agreementService.findById(id);
      res.status(200).json({
        data: agreement,
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

      const deletedAgreement = await this._agreementService.delete(id);
      res.status(200).json({
        data: deletedAgreement,
        message: SUCCESS_MESSAGES.DELETE(this.entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async create(req: Request<{}, {}, AgreementCreateParams>, res: Response) {
    try {
      const { createData, materials } = req.body;

      // Проверка тела запроса
      if (!createData || typeof createData !== "object") {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUEST_BODY_REQUIRED,
        });
      }

      // Проверка supplier_id
      if (!createData.supplier_id && createData.supplier_id !== 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUIRED_FIELD("Supplier ID"),
        });
      }

      // Валидация supplier_id
      if (isNaN(createData.supplier_id) || createData.supplier_id <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("Supplier"),
        });
      }

      // Проверка customer_id
      if (!createData.customer_id && createData.customer_id !== 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUIRED_FIELD("Customer ID"),
        });
      }

      // Валидация customer_id
      if (isNaN(createData.customer_id) || createData.customer_id <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("Customer"),
        });
      }

      // Проверка supplier_warehouse_id
      if (!createData.supplier_warehouse_id) {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUIRED_FIELD("Supplier warehouse ID"),
        });
      }

      // Валидация supplier_warehouse_id
      if (
        isNaN(createData.supplier_warehouse_id) ||
        createData.supplier_warehouse_id <= 0
      ) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("Supplier warehouse"),
        });
      }

      // Проверка customer_warehouse_id
      if (!createData.customer_warehouse_id) {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUIRED_FIELD("Customer warehouse ID"),
        });
      }

      // Валидация customer_warehouse_id
      if (
        isNaN(createData.customer_warehouse_id) ||
        createData.customer_warehouse_id <= 0
      ) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("Customer warehouse"),
        });
      }

      // Проверка статуса (опционально, но если есть - не пустой)
      if (createData.status !== undefined && createData.status.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.EMPTY_FIELD("Status"),
        });
      }

      // Проверка материалов, если они есть
      if (materials && !Array.isArray(materials)) {
        return res.status(400).json({
          message: "Materials must be an array",
        });
      }

      // Проверка каждого материала, если они есть
      if (materials && materials.length > 0) {
        for (const material of materials) {
          if (!material.material_id || material.material_id <= 0) {
            return res.status(400).json({
              message: ERROR_MESSAGES.INVALID_ID_FORMAT("Material"),
            });
          }
          if (!material.amount || material.amount <= 0) {
            return res.status(400).json({
              message: "Amount must be positive",
            });
          }
        }
      }

      const createdAgreement = await this._agreementService.create({
        createData,
        materials,
      });

      res.status(201).json({
        data: createdAgreement,
        message: SUCCESS_MESSAGES.CREATE(this.entityName),
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

      // Валидация ID
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT(this.entityName),
        });
      }

      // Проверка наличия данных для обновления
      if (
        !updateData ||
        typeof updateData !== "object" ||
        Object.keys(updateData).length === 0
      ) {
        return res.status(400).json({
          message: ERROR_MESSAGES.UPDATE_DATA_REQUIRED,
        });
      }

      // Валидация полей, если они пришли
      if (updateData.supplier_id !== undefined) {
        if (isNaN(updateData.supplier_id) || updateData.supplier_id <= 0) {
          return res.status(400).json({
            message: ERROR_MESSAGES.INVALID_ID_FORMAT("Supplier"),
          });
        }
      }

      if (updateData.customer_id !== undefined) {
        if (isNaN(updateData.customer_id) || updateData.customer_id <= 0) {
          return res.status(400).json({
            message: ERROR_MESSAGES.INVALID_ID_FORMAT("Customer"),
          });
        }
      }

      if (updateData.supplier_warehouse_id !== undefined) {
        if (
          isNaN(updateData.supplier_warehouse_id) ||
          updateData.supplier_warehouse_id <= 0
        ) {
          return res.status(400).json({
            message: ERROR_MESSAGES.INVALID_ID_FORMAT("Supplier warehouse"),
          });
        }
      }

      if (updateData.customer_warehouse_id !== undefined) {
        if (
          isNaN(updateData.customer_warehouse_id) ||
          updateData.customer_warehouse_id <= 0
        ) {
          return res.status(400).json({
            message: ERROR_MESSAGES.INVALID_ID_FORMAT("Customer warehouse"),
          });
        }
      }

      if (updateData.status !== undefined && updateData.status.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.EMPTY_FIELD("Status"),
        });
      }

      // Проверка материалов, если они есть
      if (materials && !Array.isArray(materials)) {
        return res.status(400).json({
          message: "Materials must be an array",
        });
      }

      // Проверка каждого материала, если они есть
      if (materials && materials.length > 0) {
        for (const material of materials) {
          if (!material.material_id || material.material_id <= 0) {
            return res.status(400).json({
              message: ERROR_MESSAGES.INVALID_ID_FORMAT("Material"),
            });
          }
          if (!material.amount || material.amount <= 0) {
            return res.status(400).json({
              message: "Amount must be positive",
            });
          }
        }
      }

      const updatedAgreement = await this._agreementService.update({
        id,
        updateData,
        materials,
      });

      res.status(200).json({
        data: updatedAgreement,
        message: SUCCESS_MESSAGES.UPDATE(this.entityName),
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
        return res.status(400).json({
          message: ERROR_MESSAGES.SEARCH_QUERY_REQUIRED,
        });
      }

      const searchedAgreements =
        await this._agreementService.search(searchQuery);
      res.status(200).json({
        data: searchedAgreements,
        message: SUCCESS_MESSAGES.SEARCH(
          this.entityName,
          searchedAgreements.length,
        ),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
