// services/InventoryService.ts
import { InventoryItem } from "../domain/entities/InventoryItem";
import { InventoryRepository } from "../repositories/InventoryRepository";
import { WarehouseRepository } from "../repositories/WarehouseRepository";
import { MaterialRepository } from "../repositories/MaterialRepository";
import { WarehouseHistoryService } from "./WarehouseHistoryService";
import { WAREHOUSE_HISTORY_TYPES } from "@shared/constants/warehouseHistoryTypes";
import { NotFoundError, ValidationError } from "@shared/service";

export interface InventoryTransactionParams {
  warehouse_id: number;
  material_id: number;
  amount: number;
  user_id?: number;
  agreement_id?: number;
  description?: string;
}

export class InventoryService {
  constructor(
    private inventoryRepo: InventoryRepository,
    private warehouseRepo: WarehouseRepository,
    private materialRepo: MaterialRepository,
    private historyService: WarehouseHistoryService,
  ) {}

  async getStock(warehouse_id: number, material_id: number): Promise<number> {
    const item = await this.inventoryRepo.findByWarehouseAndMaterial(
      warehouse_id,
      material_id,
    );
    return item?.amount || 0;
  }

  async getWarehouseStock(warehouse_id: number): Promise<InventoryItem[]> {
    const warehouse = await this.warehouseRepo.findById(warehouse_id);
    if (!warehouse) {
      throw new NotFoundError(
        `Склад с ID ${warehouse_id} не найден`,
        "Warehouse",
        "getWarehouseStock",
        warehouse_id,
      );
    }
    return await this.inventoryRepo.findByWarehouse(warehouse_id);
  }

  async getMaterialDistribution(material_id: number): Promise<{
    total_amount: number;
    warehouses_count: number;
    items: Array<{
      warehouse_id: number;
      warehouse_name: string;
      amount: number;
      percentage: number;
    }>;
  }> {
    const material = await this.materialRepo.findById(material_id);
    if (!material) {
      throw new NotFoundError(
        `Материал с ID ${material_id} не найден`,
        "Material",
        "getMaterialDistribution",
        material_id,
      );
    }
    return await this.inventoryRepo.getMaterialDistribution(material_id);
  }

  async findWarehouseWithMaxMaterial(
    material_id: number,
  ): Promise<{ warehouse_id: number; amount: number } | null> {
    const material = await this.materialRepo.findById(material_id);
    if (!material) {
      throw new NotFoundError(
        `Материал с ID ${material_id} не найден`,
        "Material",
        "findWarehouseWithMaxMaterial",
        material_id,
      );
    }
    return await this.inventoryRepo.findWarehouseWithMaxMaterial(material_id);
  }

  async findTopWarehousesByMaterial(
    material_id: number,
    limit: number = 5,
  ): Promise<{ warehouse_id: number; amount: number }[]> {
    const material = await this.materialRepo.findById(material_id);
    if (!material) {
      throw new NotFoundError(
        `Материал с ID ${material_id} не найден`,
        "Material",
        "findTopWarehousesByMaterial",
        material_id,
      );
    }
    return await this.inventoryRepo.findTopWarehousesByMaterial(
      material_id,
      limit,
    );
  }

  async addMaterial(
    params: InventoryTransactionParams,
  ): Promise<InventoryItem> {
    const {
      warehouse_id,
      material_id,
      amount,
      user_id,
      agreement_id,
      description,
    } = params;

    if (amount <= 0) {
      throw new ValidationError(
        "Количество должно быть положительным",
        "addMaterial",
        "amount",
        amount.toString(),
      );
    }

    const warehouse = await this.warehouseRepo.findById(warehouse_id);
    if (!warehouse) {
      throw new NotFoundError(
        `Склад с ID ${warehouse_id} не найден`,
        "Warehouse",
        "addMaterial",
        warehouse_id,
      );
    }

    const material = await this.materialRepo.findById(material_id);
    if (!material) {
      throw new NotFoundError(
        `Материал с ID ${material_id} не найден`,
        "Material",
        "addMaterial",
        material_id,
      );
    }

    let inventoryItem = await this.inventoryRepo.findByWarehouseAndMaterial(
      warehouse_id,
      material_id,
    );
    let old_amount = 0;

    if (inventoryItem) {
      old_amount = inventoryItem.amount;
      inventoryItem.addAmount(amount);
      inventoryItem = await this.inventoryRepo.update(inventoryItem);
    } else {
      inventoryItem = InventoryItem.create(warehouse_id, material_id, amount);
      inventoryItem = await this.inventoryRepo.save(inventoryItem);
    }

    await this.historyService.createEntry({
      warehouse_id,
      material_id,
      operation_type: WAREHOUSE_HISTORY_TYPES.MANUAL_ADD,
      old_amount,
      new_amount: inventoryItem.amount,
      delta: amount,
      user_id,
      agreement_id,
      description: description || `Добавлено ${amount} единиц материала`,
    });

    return inventoryItem;
  }

  async removeMaterial(
    params: InventoryTransactionParams,
  ): Promise<InventoryItem> {
    const {
      warehouse_id,
      material_id,
      amount,
      user_id,
      agreement_id,
      description,
    } = params;

    if (amount <= 0) {
      throw new ValidationError(
        "Количество должно быть положительным",
        "removeMaterial",
        "amount",
        amount.toString(),
      );
    }

    const warehouse = await this.warehouseRepo.findById(warehouse_id);
    if (!warehouse) {
      throw new NotFoundError(
        `Склад с ID ${warehouse_id} не найден`,
        "Warehouse",
        "removeMaterial",
        warehouse_id,
      );
    }

    const material = await this.materialRepo.findById(material_id);
    if (!material) {
      throw new NotFoundError(
        `Материал с ID ${material_id} не найден`,
        "Material",
        "removeMaterial",
        material_id,
      );
    }

    const inventoryItem = await this.inventoryRepo.findByWarehouseAndMaterial(
      warehouse_id,
      material_id,
    );
    if (!inventoryItem) {
      throw new ValidationError(
        `Материал "${material.name}" не найден на складе "${warehouse.name}"`,
        "removeMaterial",
        "material_id",
        material_id.toString(),
      );
    }

    const old_amount = inventoryItem.amount;
    inventoryItem.subtractAmount(amount);
    const updatedItem = await this.inventoryRepo.update(inventoryItem);

    await this.historyService.createEntry({
      warehouse_id,
      material_id,
      operation_type: WAREHOUSE_HISTORY_TYPES.MANUAL_REMOVE,
      old_amount,
      new_amount: updatedItem.amount,
      delta: -amount,
      user_id,
      agreement_id,
      description: description || `Списано ${amount} единиц материала`,
    });

    return updatedItem;
  }

  async setAmount(
    params: InventoryTransactionParams,
  ): Promise<InventoryItem | null> {
    const {
      warehouse_id,
      material_id,
      amount,
      user_id,
      agreement_id,
      description,
    } = params;

    if (amount < 0) {
      throw new ValidationError(
        "Количество не может быть отрицательным",
        "setAmount",
        "amount",
        amount.toString(),
      );
    }

    const warehouse = await this.warehouseRepo.findById(warehouse_id);
    if (!warehouse) {
      throw new NotFoundError(
        `Склад с ID ${warehouse_id} не найден`,
        "Warehouse",
        "setAmount",
        warehouse_id,
      );
    }

    const material = await this.materialRepo.findById(material_id);
    if (!material) {
      throw new NotFoundError(
        `Материал с ID ${material_id} не найден`,
        "Material",
        "setAmount",
        material_id,
      );
    }

    let inventoryItem = await this.inventoryRepo.findByWarehouseAndMaterial(
      warehouse_id,
      material_id,
    );
    let old_amount = 0;

    if (inventoryItem) {
      old_amount = inventoryItem.amount;
      if (amount === 0) {
        await this.inventoryRepo.delete(warehouse_id, material_id);
        await this.historyService.createEntry({
          warehouse_id,
          material_id,
          operation_type: WAREHOUSE_HISTORY_TYPES.MANUAL_REMOVE,
          old_amount,
          new_amount: 0,
          delta: -old_amount,
          user_id,
          agreement_id,
          description:
            description || `Удалён материал (было ${old_amount} единиц)`,
        });
        return null;
      } else {
        inventoryItem.setAmount(amount);
        inventoryItem = await this.inventoryRepo.update(inventoryItem);
      }
    } else if (amount > 0) {
      inventoryItem = InventoryItem.create(warehouse_id, material_id, amount);
      inventoryItem = await this.inventoryRepo.save(inventoryItem);
    } else {
      return null;
    }

    await this.historyService.createEntry({
      warehouse_id,
      material_id,
      operation_type: WAREHOUSE_HISTORY_TYPES.MANUAL_UPDATE,
      old_amount,
      new_amount: inventoryItem.amount,
      delta: amount - old_amount,
      user_id,
      agreement_id,
      description:
        description || `Количество изменено с ${old_amount} на ${amount}`,
    });

    return inventoryItem;
  }

  async checkAvailability(
    warehouse_id: number,
    requirements: Array<{ material_id: number; required_amount: number }>,
  ): Promise<boolean> {
    for (const req of requirements) {
      const currentAmount = await this.getStock(warehouse_id, req.material_id);
      if (currentAmount < req.required_amount) {
        return false;
      }
    }
    return true;
  }

  async validateAvailability(
    warehouse_id: number,
    requirements: Array<{ material_id: number; required_amount: number }>,
  ): Promise<void> {
    for (const req of requirements) {
      const currentAmount = await this.getStock(warehouse_id, req.material_id);
      if (currentAmount < req.required_amount) {
        const material = await this.materialRepo.findById(req.material_id);
        throw new ValidationError(
          `Недостаточно материала "${material?.name || req.material_id}". Доступно: ${currentAmount}, требуется: ${req.required_amount}`,
          "validateAvailability",
          "material_id",
          req.material_id.toString(),
        );
      }
    }
  }
}
