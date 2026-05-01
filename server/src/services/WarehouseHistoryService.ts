import { WarehouseHistoryItem } from "../domain/entities/WarehouseHistoryItem";
import {
  WarehouseHistoryRepository,
  WarehouseHistoryItemWithDetails,
  WarehouseHistoryResponse,
} from "../repositories/WarehouseHistoryRepository";
import { WarehouseRepository } from "../repositories/WarehouseRepository";
import { MaterialRepository } from "../repositories/MaterialRepository";
import { WarehouseHistoryType } from "@shared/constants/warehouseHistoryTypes";
import { NotFoundError } from "@shared/service";

export interface CreateHistoryEntryParams {
  warehouse_id: number;
  material_id: number;
  operation_type: WarehouseHistoryType;
  old_amount: number;
  new_amount: number;
  delta: number;
  user_id?: number;
  agreement_id?: number;
  description?: string;
}

export class WarehouseHistoryService {
  constructor(
    private historyRepo: WarehouseHistoryRepository,
    private warehouseRepo: WarehouseRepository,
    private materialRepo: MaterialRepository,
  ) {}

  async createEntry(
    params: CreateHistoryEntryParams,
  ): Promise<WarehouseHistoryItem> {
    const warehouse = await this.warehouseRepo.findById(params.warehouse_id);
    if (!warehouse) {
      throw new NotFoundError(
        `Склад с ID ${params.warehouse_id} не найден`,
        "Warehouse",
        "createEntry",
        params.warehouse_id,
      );
    }

    const material = await this.materialRepo.findById(params.material_id);
    if (!material) {
      throw new NotFoundError(
        `Материал с ID ${params.material_id} не найден`,
        "Material",
        "createEntry",
        params.material_id,
      );
    }

    const historyItem = WarehouseHistoryItem.create(params);
    return await this.historyRepo.save(historyItem);
  }

  async getHistoryByWarehouse(
    warehouse_id: number,
    limit: number = 100,
    offset: number = 0,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<WarehouseHistoryResponse> {
    const warehouse = await this.warehouseRepo.findById(warehouse_id);
    if (!warehouse) {
      throw new NotFoundError(
        `Склад с ID ${warehouse_id} не найден`,
        "Warehouse",
        "getHistoryByWarehouse",
        warehouse_id,
      );
    }

    return await this.historyRepo.findByWarehouseWithDetails(
      warehouse_id,
      limit,
      offset,
      sortBy,
      sortOrder,
    );
  }

  async getHistoryByAgreement(
    agreement_id: number,
    limit: number = 100,
    offset: number = 0,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<WarehouseHistoryResponse> {
    return await this.historyRepo.findByAgreementWithDetails(
      agreement_id,
      limit,
      offset,
      sortBy,
      sortOrder,
    );
  }

  async getHistoryByMaterial(
    material_id: number,
    limit: number = 100,
    offset: number = 0,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<WarehouseHistoryResponse> {
    const material = await this.materialRepo.findById(material_id);
    if (!material) {
      throw new NotFoundError(
        `Материал с ID ${material_id} не найден`,
        "Material",
        "getHistoryByMaterial",
        material_id,
      );
    }

    return await this.historyRepo.findByMaterialWithDetails(
      material_id,
      limit,
      offset,
      sortBy,
      sortOrder,
    );
  }
}
