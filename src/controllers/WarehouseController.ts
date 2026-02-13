import { Pool } from "pg";
import { Request, Response } from "express";
import { WarehouseService } from "@src/services";
import { baseErrorHandling } from "@src/utils";
import { CreateWarehouseDTO } from "@src/dto";

export class WarehouseController {
  private _warehouseService: WarehouseService;

  constructor(dbConnection: Pool) {
    this._warehouseService = new WarehouseService(dbConnection);
  }

  async findAll(req: Request, res: Response) {
    try {
      const warehouses = await this._warehouseService.findAll();
      res.status(200).json({
        data: warehouses,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findById(req: Request<{ id: string }, {}, {}>, res: Response) {
    try {
      const id = parseInt(req.params.id);

      const warehouse = await this._warehouseService.findById(id);
      res.status(200).json({
        data: warehouse,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async create(req: Request<{}, {}, CreateWarehouseDTO>, res: Response) {
    try {
      const createData = req.body;
      const warehouse = await this._warehouseService.create(createData);
      res.status(201).json({
        data: warehouse,
        message: "Warehouse created successfully",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async update(req: Request<{ id: string }>, res: Response) {
    try {
      const id = parseInt(req.params.id);

      const updateData = req.body;
      const warehouse = await this._warehouseService.update(id, updateData);
      res.status(200).json({
        data: warehouse,
        message: "Warehouse updated successfully",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async delete(req: Request<{ id: string }, {}, {}>, res: Response) {
    try {
      const id = parseInt(req.params.id);

      const deletedWarehouse = await this._warehouseService.delete(id);
      res.status(200).json({
        data: deletedWarehouse,
        message: "Warehouse deleted successfully",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async search(req: Request, res: Response) {
    try {
      const query = req.query.q as string;

      const warehouses = await this._warehouseService.search(query.trim());
      res.status(200).json({
        data: warehouses,
        message: `Found ${warehouses.length} warehouse(s)`,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findByManagerId(req: Request<{ managerId: string }>, res: Response) {
    try {
      const managerId = parseInt(req.params.managerId);

      const warehouses =
        await this._warehouseService.findByManagerId(managerId);
      res.status(200).json({
        data: warehouses,
        message: `Found ${warehouses.length} warehouse(s) for manager`,
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
      const warehouseId = parseInt(req.params.id);
      const { managerId } = req.body;

      if (isNaN(warehouseId)) {
        return res.status(400).json({
          error: "Invalid warehouse ID",
        });
      }

      // Проверяем managerId - может быть null или числом
      let parsedManagerId: number | null = null;
      if (typeof managerId === "number") {
        parsedManagerId = managerId;
      } else if (managerId !== undefined && managerId !== null) {
        if (typeof managerId === "string") {
          parsedManagerId = parseInt(managerId);
          if (isNaN(parsedManagerId)) {
            return res.status(400).json({
              error: "Invalid manager ID",
            });
          }
        } else {
          return res.status(400).json({
            error: "Invalid manager ID format",
          });
        }
      } else if (managerId === null) {
        parsedManagerId = null;
      }

      const warehouse = await this._warehouseService.assignManager(
        warehouseId,
        parsedManagerId,
      );

      const message =
        parsedManagerId === null
          ? "Manager unassigned from warehouse successfully"
          : "Manager assigned to warehouse successfully";

      res.status(200).json({
        data: warehouse,
        message,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
