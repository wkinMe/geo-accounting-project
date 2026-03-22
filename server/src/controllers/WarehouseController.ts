import { Pool } from "pg";
import { Request, Response } from "express";
import { WarehouseService } from "@src/services";
import { baseErrorHandling } from "@src/utils";
import { CreateWarehouseDTO, UpdateWarehouseDTO } from "@shared/dto";
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  USER_ROLES,
} from "@shared/constants";

export class WarehouseController {
  private _warehouseService: WarehouseService;
  private entityName = "warehouse";

  constructor(dbConnection: Pool) {
    this._warehouseService = new WarehouseService(dbConnection);
  }

  async findAll(req: Request, res: Response) {
    try {
      // @ts-ignore - пользователь добавляется в req через middleware
      const user = req.user;

      // Контроллер подготавливает фильтры на основе пользователя
      const filters: Record<string, string> = {};

      if (
        user.role === USER_ROLES.USER ||
        user.role === USER_ROLES.MANAGER ||
        user.role === USER_ROLES.ADMIN
      ) {
        filters.organization_id = user.organization_id; // Берем из токена/сессии
      }

      const warehouses = await this._warehouseService.findAll(filters);

      res.status(200).json({
        data: warehouses,
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

      const warehouse = await this._warehouseService.findById(id);
      res.status(200).json({
        data: warehouse,
        message: SUCCESS_MESSAGES.FIND_BY_ID(this.entityName, id),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async create(req: Request<{}, {}, CreateWarehouseDTO>, res: Response) {
    try {
      const createData = req.body;

      // Проверка тела запроса
      if (!createData || typeof createData !== "object") {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUEST_BODY_REQUIRED,
        });
      }

      // Проверка обязательных полей
      if (!createData.name || createData.name.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUIRED_FIELD("Warehouse name"),
        });
      }

      if (!createData.organization_id) {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUIRED_FIELD("Organization ID"),
        });
      }

      if (
        createData.latitude !== undefined &&
        (createData.latitude < -90 || createData.latitude > 90)
      ) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_LATITUDE,
        });
      }

      if (
        createData.longitude !== undefined &&
        (createData.longitude < -180 || createData.longitude > 180)
      ) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_LONGITUDE,
        });
      }

      const warehouse = await this._warehouseService.create(createData);
      res.status(201).json({
        data: warehouse,
        message: SUCCESS_MESSAGES.CREATE(this.entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async update(
    req: Request<{ id: string }, {}, Omit<UpdateWarehouseDTO, "id">>,
    res: Response,
  ) {
    try {
      const id = Number(req.params.id);
      const updateData = req.body;

      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT(this.entityName),
        });
      }

      // Проверка, что есть что обновлять
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
      if (updateData.name !== undefined && updateData.name.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.EMPTY_FIELD("Warehouse name"),
        });
      }

      // Проверка organization_id, если оно пришло
      if (updateData.organization_id !== undefined) {
        if (
          isNaN(updateData.organization_id) ||
          updateData.organization_id <= 0
        ) {
          return res.status(400).json({
            message: ERROR_MESSAGES.REQUIRED_FIELD("Organization ID"),
          });
        }
      }

      if (
        updateData.latitude !== undefined &&
        (updateData.latitude < -90 || updateData.latitude > 90)
      ) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_LATITUDE,
        });
      }

      if (
        updateData.longitude !== undefined &&
        (updateData.longitude < -180 || updateData.longitude > 180)
      ) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_LONGITUDE,
        });
      }

      const warehouse = await this._warehouseService.update(id, updateData);
      res.status(200).json({
        data: warehouse,
        message: SUCCESS_MESSAGES.UPDATE(this.entityName),
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

      const deletedWarehouse = await this._warehouseService.delete(id);
      res.status(200).json({
        data: deletedWarehouse,
        message: SUCCESS_MESSAGES.DELETE(this.entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async search(req: Request<{}, {}, {}, { q?: string }>, res: Response) {
    try {
      const { q } = req.query;
      // @ts-ignore - пользователь добавляется в req через middleware
      const user = req.user;

      if (!q || q.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.SEARCH_QUERY_REQUIRED,
        });
      }

      // Контроллер подготавливает фильтры на основе пользователя
      const filters: Record<string, string> = {};

      if (
        user.role === USER_ROLES.USER ||
        user.role === USER_ROLES.MANAGER ||
        user.role === USER_ROLES.ADMIN
      ) {
        filters.organization_id = user.organization_id; // Берем из токена/сессии
      }

      const warehouses = await this._warehouseService.search(
        q.trim(),
        filters,
      );

      res.status(200).json({
        data: warehouses,
        message: SUCCESS_MESSAGES.SEARCH(this.entityName, warehouses.length),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findByManagerId(req: Request<{ managerId: string }>, res: Response) {
    try {
      const managerId = Number(req.params.managerId);

      if (isNaN(managerId) || managerId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("manager"),
        });
      }

      const warehouses =
        await this._warehouseService.findByManagerId(managerId);

      // Проверяем, есть ли склады
      if (warehouses.length === 0) {
        return res.status(200).json({
          data: warehouses,
          message: SUCCESS_MESSAGES.FIND_BY_MANAGER_ID(
            this.entityName,
            0,
            "Unknown",
          ),
        });
      }

      res.status(200).json({
        data: warehouses,
        message: SUCCESS_MESSAGES.FIND_BY_MANAGER_ID(
          this.entityName,
          warehouses.length,
          warehouses[0]?.manager?.name || "Unknown",
        ),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async assignManager(
    req: Request<{ id: string }, {}, { managerId: number | null }>,
    res: Response,
  ) {
    try {
      const warehouseId = Number(req.params.id);
      const { managerId } = req.body;

      if (isNaN(warehouseId) || warehouseId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT(this.entityName),
        });
      }

      // Проверка managerId (может быть null для снятия менеджера)
      if (managerId !== null && (isNaN(managerId) || managerId <= 0)) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("manager"),
        });
      }

      const warehouse = await this._warehouseService.assignManager(
        warehouseId,
        managerId,
      );

      const message = SUCCESS_MESSAGES.ASSIGN_MANAGER(
        warehouse.manager?.name || "Unknown",
        managerId !== null,
      );

      res.status(200).json({
        data: warehouse,
        message,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  // Добавление материала на склад
  async addMaterial(
    req: Request<{ id: string }, {}, { materialId: number; amount: number }>,
    res: Response,
  ) {
    try {
      const warehouseId = Number(req.params.id);
      const { materialId, amount } = req.body;

      if (isNaN(warehouseId) || warehouseId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT(this.entityName),
        });
      }

      if (isNaN(materialId) || materialId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("material"),
        });
      }

      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_AMOUNT,
        });
      }

      const result = await this._warehouseService.addMaterial(
        warehouseId,
        materialId,
        amount,
      );

      res.status(201).json({
        data: result,
        message: SUCCESS_MESSAGES.CREATE("warehouse material"),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  // Обновление количества материала на складе
  async updateMaterialAmount(
    req: Request<{ id: string; materialId: string }, {}, { amount: number }>,
    res: Response,
  ) {
    try {
      const warehouseId = Number(req.params.id);
      const materialId = Number(req.params.materialId);
      const { amount } = req.body;

      if (isNaN(warehouseId) || warehouseId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT(this.entityName),
        });
      }

      if (isNaN(materialId) || materialId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("material"),
        });
      }

      if (isNaN(amount) || amount < 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_AMOUNT,
        });
      }

      const result = await this._warehouseService.updateMaterialAmount(
        warehouseId,
        materialId,
        amount,
      );

      res.status(200).json({
        data: result,
        message: SUCCESS_MESSAGES.UPDATE("warehouse material amount"),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  // Удаление материала со склада
  async removeMaterial(
    req: Request<{ id: string; materialId: string }>,
    res: Response,
  ) {
    try {
      const warehouseId = Number(req.params.id);
      const materialId = Number(req.params.materialId);

      if (isNaN(warehouseId) || warehouseId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT(this.entityName),
        });
      }

      if (isNaN(materialId) || materialId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("material"),
        });
      }

      const result = await this._warehouseService.removeMaterial(
        warehouseId,
        materialId,
      );

      res.status(200).json({
        data: result,
        message: SUCCESS_MESSAGES.DELETE("warehouse material"),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  // Получение всех материалов на складе
  async getMaterials(req: Request<{ id: string }, {}, {}, {}>, res: Response) {
    try {
      const warehouseId = Number(req.params.id);

      if (isNaN(warehouseId) || warehouseId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("warehouse material"),
        });
      }

      const materials = await this._warehouseService.getMaterials(warehouseId);

      res.status(200).json({
        data: materials,
        message: SUCCESS_MESSAGES.FIND_ALL("warehouse material"),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async searchMaterialByWarehouse(
    req: Request<{ id: string }, {}, {}, { q?: string }>,
    res: Response,
  ) {
    try {
      const warehouseId = Number(req.params.id);
      const { q } = req.query;

      if (isNaN(warehouseId) || warehouseId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("warehouse material"),
        });
      }

      const materials = await this._warehouseService.searchMaterials(
        warehouseId,
        q.trim(),
      );

      res.status(200).json({
        data: materials,
        message: SUCCESS_MESSAGES.SEARCH(
          "warehouse materials",
          materials.length,
        ),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  // Добавить в класс WarehouseController

  async findByOrganizationId(
    req: Request<{ organizationId: string }>,
    res: Response,
  ) {
    try {
      const organizationId = Number(req.params.organizationId);

      if (isNaN(organizationId) || organizationId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("organization"),
        });
      }

      const warehouses =
        await this._warehouseService.findByOrganizationId(organizationId);

      res.status(200).json({
        data: warehouses,
        message: SUCCESS_MESSAGES.FIND_BY_ID(this.entityName, organizationId),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async searchByOrganizationId(
    req: Request<{ organizationId: string }, {}, {}, { q?: string }>,
    res: Response,
  ) {
    try {
      const organizationId = Number(req.params.organizationId);
      const { q } = req.query;

      if (isNaN(organizationId) || organizationId <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("organization"),
        });
      }

      if (!q || q.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.SEARCH_QUERY_REQUIRED,
        });
      }

      const warehouses = await this._warehouseService.searchByOrganizationId(
        organizationId,
        q.trim(),
      );

      res.status(200).json({
        data: warehouses,
        message: SUCCESS_MESSAGES.SEARCH(this.entityName, warehouses.length),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
