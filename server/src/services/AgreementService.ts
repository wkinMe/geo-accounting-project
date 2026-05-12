// services/AgreementService.ts
import { Pool } from "pg";
import { Agreement } from "../domain/entities/Agreement";
import { AgreementMaterial } from "../domain/entities/AgreementMaterial";
import { AgreementRepository } from "../repositories/AgreementRepository";
import { AgreementMaterialRepository } from "../repositories/AgreementMaterialRepository";
import { UserRepository } from "../repositories/UserRepository";
import { WarehouseRepository } from "../repositories/WarehouseRepository";
import { MaterialRepository } from "../repositories/MaterialRepository";
import { InventoryService } from "./InventoryService";
import { WarehouseHistoryService } from "./WarehouseHistoryService";
import {
  AGREEMENT_STATUS,
  IRREVERSIBLE_STATUSES,
  AgreementStatus,
  ACTIVE_STATUSES,
  PREACTIVE_STATUSES,
  REJECTED_STATUSES,
} from "@shared/constants";
import { WAREHOUSE_HISTORY_TYPES } from "@shared/constants/warehouseHistoryTypes";
import { UserDataDTO } from "@shared/dto";
import {
  ValidationError,
  NotFoundError,
  ServiceError,
  DatabaseError,
} from "@shared/service";

export interface AgreementCreateParams {
  supplier_id: number;
  customer_id: number;
  supplier_warehouse_id: number;
  customer_warehouse_id: number;
  status?: AgreementStatus;
  materials?: Array<{
    material_id: number;
    amount: number;
    item_price?: number;
  }>;
}

export interface AgreementUpdateParams {
  id: number;
  supplier_id?: number;
  customer_id?: number;
  supplier_warehouse_id?: number;
  customer_warehouse_id?: number;
  status?: AgreementStatus;
  materials?: Array<{
    material_id: number;
    amount: number;
    item_price?: number;
  }>;
}

export class AgreementService {
  constructor(
    private agreementRepo: AgreementRepository,
    private agreementMaterialRepo: AgreementMaterialRepository,
    private userRepo: UserRepository,
    private warehouseRepo: WarehouseRepository,
    private materialRepo: MaterialRepository,
    private inventoryService: InventoryService,
    private historyService: WarehouseHistoryService,
  ) {}

  private isActiveStatus(status: AgreementStatus): boolean {
    return IRREVERSIBLE_STATUSES.includes(status);
  }

  private async validateUserExists(
    user_id: number,
    fieldName: string,
  ): Promise<void> {
    const user = await this.userRepo.findById(user_id);
    if (!user) {
      throw new NotFoundError(
        `Пользователь с ID ${user_id} не найден`,
        "User",
        fieldName,
        user_id,
      );
    }
  }

  private async validateWarehouseExists(
    warehouse_id: number,
    fieldName: string,
  ): Promise<void> {
    const warehouse = await this.warehouseRepo.findById(warehouse_id);
    if (!warehouse) {
      throw new NotFoundError(
        `Склад с ID ${warehouse_id} не найден`,
        "Warehouse",
        fieldName,
        warehouse_id,
      );
    }
  }

  private async validateMaterialExists(material_id: number): Promise<void> {
    const material = await this.materialRepo.findById(material_id);
    if (!material) {
      throw new NotFoundError(
        `Материал с ID ${material_id} не найден`,
        "Material",
        "validateMaterial",
        material_id,
      );
    }
  }

  private async getAgreementMaterials(
    agreement_id: number,
  ): Promise<AgreementMaterial[]> {
    return await this.agreementMaterialRepo.findByAgreement(agreement_id);
  }

  async findAll(user: UserDataDTO): Promise<Agreement[]> {
    try {
      const filters: {
        user_id?: number;
        organization_id?: number;
        role?: string;
      } = {};

      if (user.role === "admin") {
        filters.role = "admin";
        filters.organization_id = user.organization_id;
      } else if (user.role === "manager") {
        filters.role = "manager";
        filters.user_id = user.id;
      } else if (user.role === "user") {
        filters.role = "user";
      }

      const agreements = await this.agreementRepo.findAll(filters);
      return agreements;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new ServiceError(
        "Не удалось получить список договоров",
        "AgreementService",
        "findAll",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async findById(id: number): Promise<Agreement> {
    try {
      const agreement = await this.agreementRepo.findById(id);
      if (!agreement) {
        throw new NotFoundError(
          `Договор с ID ${id} не найден`,
          "Agreement",
          "findById",
          id,
        );
      }
      return agreement;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError(
        `Не удалось найти договор с ID ${id}`,
        "AgreementService",
        "findById",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  // services/AgreementService.ts (только изменённые методы)

  async update(params: AgreementUpdateParams): Promise<Agreement> {
    try {
      const existingAgreement = await this.findById(params.id);
      const oldStatus = existingAgreement.status;
      const newStatus = params.status || oldStatus;

      if (params.supplier_id !== undefined) {
        await this.validateUserExists(params.supplier_id, "supplier_id");
        existingAgreement.updateSupplier(params.supplier_id);
      }

      if (params.customer_id !== undefined) {
        await this.validateUserExists(params.customer_id, "customer_id");
        existingAgreement.updateCustomer(params.customer_id);
      }

      if (params.supplier_warehouse_id !== undefined) {
        await this.validateWarehouseExists(
          params.supplier_warehouse_id,
          "supplier_warehouse_id",
        );
        existingAgreement.updateSupplierWarehouse(params.supplier_warehouse_id);
      }

      if (params.customer_warehouse_id !== undefined) {
        await this.validateWarehouseExists(
          params.customer_warehouse_id,
          "customer_warehouse_id",
        );
        existingAgreement.updateCustomerWarehouse(params.customer_warehouse_id);
      }

      if (params.status !== undefined) {
        existingAgreement.updateStatus(params.status);
      }

      await this.agreementRepo.update(params.id, existingAgreement);

      if (params.materials !== undefined) {
        await this.agreementMaterialRepo.deleteByAgreement(params.id);

        if (params.materials.length > 0) {
          const materials: AgreementMaterial[] = [];

          for (const material of params.materials) {
            await this.validateMaterialExists(material.material_id);

            if (material.amount <= 0) {
              throw new ValidationError(
                "Количество материала должно быть положительным",
                "update",
                "amount",
                material.amount.toString(),
              );
            }

            materials.push(
              AgreementMaterial.create({
                agreement_id: params.id,
                material_id: material.material_id,
                amount: material.amount,
                item_price: material.item_price,
              }),
            );
          }

          await this.agreementMaterialRepo.saveMany(materials);
        }
      }

      // Если переход из любой неактивной фазы в активную - в активный
      const isBecomingActiveIrreversible =
        ACTIVE_STATUSES.includes(newStatus) &&
        (PREACTIVE_STATUSES.includes(oldStatus) ||
          REJECTED_STATUSES.includes(oldStatus));
      if (isBecomingActiveIrreversible) {
        this.processSupplierWriteOff(params.id);
      }

      // Если переход из ACTIVE_PHASE - в любую неактивную
      const isLeavingActive =
        ACTIVE_STATUSES.includes(oldStatus) &&
        (PREACTIVE_STATUSES.includes(newStatus) ||
          REJECTED_STATUSES.includes(newStatus));
      if (isLeavingActive) {
        this.processSupplierRollback(params.id);
      }

      // Если завершаем договор
      const isCompleted = newStatus === AGREEMENT_STATUS.COMPLETED;
      if (isCompleted) {
        this.processCustomerReceipt(params.id);
      }

      // Если договор переходит из "Завершён" в любой активный, т.е. материалы ещё заморожены у поставщика, но надо списать у покупателя обратно
      const isLeavingCompletedToActive =
        ACTIVE_STATUSES.includes(newStatus) &&
        newStatus !== AGREEMENT_STATUS.COMPLETED;
      if (isLeavingCompletedToActive) {
        this.processCustomerWriteOff(params.id);
      }

      return await this.findById(params.id);
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof NotFoundError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      throw new ServiceError(
        `Не удалось обновить договор с ID ${params.id}`,
        "AgreementService",
        "update",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async create(params: AgreementCreateParams): Promise<Agreement> {
    try {
      await this.validateUserExists(params.supplier_id, "supplier_id");
      await this.validateUserExists(params.customer_id, "customer_id");
      await this.validateWarehouseExists(
        params.supplier_warehouse_id,
        "supplier_warehouse_id",
      );
      await this.validateWarehouseExists(
        params.customer_warehouse_id,
        "customer_warehouse_id",
      );

      if (params.supplier_warehouse_id === params.customer_warehouse_id) {
        throw new ValidationError(
          "Склад поставщика и склад покупателя не могут быть одинаковыми",
          "create",
          "customer_warehouse_id",
          params.customer_warehouse_id.toString(),
        );
      }

      const agreement = Agreement.create({
        supplier_id: params.supplier_id,
        customer_id: params.customer_id,
        supplier_warehouse_id: params.supplier_warehouse_id,
        customer_warehouse_id: params.customer_warehouse_id,
        status: params.status || AGREEMENT_STATUS.DRAFT,
      });

      const savedAgreement = await this.agreementRepo.save(agreement);

      if (params.materials && params.materials.length > 0) {
        const materials: AgreementMaterial[] = [];

        for (const material of params.materials) {
          await this.validateMaterialExists(material.material_id);

          if (material.amount <= 0) {
            throw new ValidationError(
              "Количество материала должно быть положительным",
              "create",
              "amount",
              material.amount.toString(),
            );
          }

          materials.push(
            AgreementMaterial.create({
              agreement_id: savedAgreement.id!,
              material_id: material.material_id,
              amount: material.amount,
              item_price: material.item_price,
            }),
          );
        }

        await this.agreementMaterialRepo.saveMany(materials);
      }

      // Если договор создаётся с активным статусом (включая "Завершён")
      if (this.isActiveStatus(savedAgreement.status)) {
        await this.processSupplierWriteOff(savedAgreement.id!);
      }

      // Если договор создаётся со статусом "Завершён"
      if (savedAgreement.status === AGREEMENT_STATUS.COMPLETED) {
        await this.processCustomerReceipt(savedAgreement.id!);
      }

      return await this.findById(savedAgreement.id!);
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof NotFoundError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      throw new ServiceError(
        "Не удалось создать договор",
        "AgreementService",
        "create",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.findById(id);
      await this.agreementMaterialRepo.deleteByAgreement(id);
      await this.agreementRepo.delete(id);
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError(
        `Не удалось удалить договор с ID ${id}`,
        "AgreementService",
        "delete",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  // Списание со склада поставщика
  private async processSupplierWriteOff(agreementId: number): Promise<void> {
    const agreement = await this.findById(agreementId);
    const materials = await this.getAgreementMaterials(agreementId);

    if (materials.length === 0) return;

    const requirements = materials.map((m) => ({
      material_id: m.material_id,
      required_amount: m.amount,
    }));

    await this.inventoryService.validateAvailability(
      agreement.supplier_warehouse_id,
      requirements,
    );

    for (const material of materials) {
      const supplierStock = await this.inventoryService.getStock(
        agreement.supplier_warehouse_id,
        material.material_id,
      );

      const newAmount = supplierStock - material.amount;

      await this.inventoryService.setAmount({
        warehouse_id: agreement.supplier_warehouse_id,
        material_id: material.material_id,
        amount: newAmount,
        agreement_id: agreementId,
        user_id: agreement.supplier_id,
        description: `Списание по договору №${agreementId}`,
      });

      await this.historyService.createEntry({
        warehouse_id: agreement.supplier_warehouse_id,
        material_id: material.material_id,
        operation_type: WAREHOUSE_HISTORY_TYPES.AGREEMENT_OUT,
        old_amount: supplierStock,
        new_amount: newAmount,
        delta: -material.amount,
        user_id: agreement.supplier_id,
        agreement_id: agreementId,
        description: `Списание по договору №${agreementId}`,
      });
    }
  }

  // Поступление на склад покупателя
  private async processCustomerReceipt(agreementId: number): Promise<void> {
    const agreement = await this.findById(agreementId);
    const materials = await this.getAgreementMaterials(agreementId);

    if (materials.length === 0) return;

    for (const material of materials) {
      const customerStock = await this.inventoryService.getStock(
        agreement.customer_warehouse_id,
        material.material_id,
      );

      const newAmount = customerStock + material.amount;

      await this.inventoryService.setAmount({
        warehouse_id: agreement.customer_warehouse_id,
        material_id: material.material_id,
        amount: newAmount,
        agreement_id: agreementId,
        user_id: agreement.customer_id,
        description: `Поступление по договору №${agreementId}`,
      });

      await this.historyService.createEntry({
        warehouse_id: agreement.customer_warehouse_id,
        material_id: material.material_id,
        operation_type: WAREHOUSE_HISTORY_TYPES.AGREEMENT_IN,
        old_amount: customerStock,
        new_amount: newAmount,
        delta: material.amount,
        user_id: agreement.customer_id,
        agreement_id: agreementId,
        description: `Поступление по договору №${agreementId}`,
      });
    }
  }

  // Откат (если договор выходит из завершённого статуса или отменяется/просрочивается)
  private async processAgreementDeactivation(
    agreementId: number,
    wasCompleted: boolean = false,
  ): Promise<void> {
    const agreement = await this.findById(agreementId);
    const materials = await this.getAgreementMaterials(agreementId);

    if (materials.length === 0) return;

    for (const material of materials) {
      // Возврат поставщику (всегда нужен, так как материалы были списаны)
      const supplierStock = await this.inventoryService.getStock(
        agreement.supplier_warehouse_id,
        material.material_id,
      );

      const supplierNewAmount = supplierStock + material.amount;

      await this.inventoryService.setAmount({
        warehouse_id: agreement.supplier_warehouse_id,
        material_id: material.material_id,
        amount: supplierNewAmount,
        agreement_id: agreementId,
        description: `Возврат на склад поставщика по договору №${agreementId}`,
      });

      await this.historyService.createEntry({
        warehouse_id: agreement.supplier_warehouse_id,
        material_id: material.material_id,
        operation_type: WAREHOUSE_HISTORY_TYPES.AGREEMENT_IN,
        old_amount: supplierStock,
        new_amount: supplierNewAmount,
        delta: material.amount,
        agreement_id: agreementId,
        description: `Возврат на склад поставщика по договору №${agreementId}`,
      });

      // Списание у покупателя - только если договор был завершён
      if (wasCompleted) {
        const customerStock = await this.inventoryService.getStock(
          agreement.customer_warehouse_id,
          material.material_id,
        );

        const customerNewAmount = customerStock - material.amount;

        await this.inventoryService.setAmount({
          warehouse_id: agreement.customer_warehouse_id,
          material_id: material.material_id,
          amount: customerNewAmount,
          agreement_id: agreementId,
          description: `Списание со склада покупателя по договору №${agreementId}`,
        });

        await this.historyService.createEntry({
          warehouse_id: agreement.customer_warehouse_id,
          material_id: material.material_id,
          operation_type: WAREHOUSE_HISTORY_TYPES.AGREEMENT_OUT,
          old_amount: customerStock,
          new_amount: customerNewAmount,
          delta: -material.amount,
          agreement_id: agreementId,
          description: `Списание со склада покупателя по договору №${agreementId}`,
        });
      }
    }
  }

  // Возврат поставщику при выходе из активного статуса (без списания у покупателя)
  private async processSupplierRollback(agreementId: number): Promise<void> {
    const agreement = await this.findById(agreementId);
    const materials = await this.getAgreementMaterials(agreementId);

    if (materials.length === 0) return;

    for (const material of materials) {
      // Возврат поставщику
      const supplierStock = await this.inventoryService.getStock(
        agreement.supplier_warehouse_id,
        material.material_id,
      );

      const supplierNewAmount = supplierStock + material.amount;

      await this.inventoryService.setAmount({
        warehouse_id: agreement.supplier_warehouse_id,
        material_id: material.material_id,
        amount: supplierNewAmount,
        agreement_id: agreementId,
        description: `Возврат на склад поставщика при откате статуса по договору №${agreementId}`,
      });

      await this.historyService.createEntry({
        warehouse_id: agreement.supplier_warehouse_id,
        material_id: material.material_id,
        operation_type: WAREHOUSE_HISTORY_TYPES.AGREEMENT_IN,
        old_amount: supplierStock,
        new_amount: supplierNewAmount,
        delta: material.amount,
        agreement_id: agreementId,
        description: `Возврат на склад поставщика при откате статуса по договору №${agreementId}`,
      });
    }
  }

  // Списание со склада покупателя (без возврата поставщику)
  private async processCustomerWriteOff(agreementId: number): Promise<void> {
    const agreement = await this.findById(agreementId);
    const materials = await this.getAgreementMaterials(agreementId);

    if (materials.length === 0) return;

    for (const material of materials) {
      const customerStock = await this.inventoryService.getStock(
        agreement.customer_warehouse_id,
        material.material_id,
      );

      const newAmount = customerStock - material.amount;

      await this.inventoryService.setAmount({
        warehouse_id: agreement.customer_warehouse_id,
        material_id: material.material_id,
        amount: newAmount,
        agreement_id: agreementId,
        description: `Списание со склада покупателя при переходе из завершённого в активный статус по договору №${agreementId}`,
      });

      await this.historyService.createEntry({
        warehouse_id: agreement.customer_warehouse_id,
        material_id: material.material_id,
        operation_type: WAREHOUSE_HISTORY_TYPES.AGREEMENT_OUT,
        old_amount: customerStock,
        new_amount: newAmount,
        delta: -material.amount,
        agreement_id: agreementId,
        description: `Списание со склада покупателя при переходе из завершённого в активный статус по договору №${agreementId}`,
      });
    }
  }

  async findAllWithDetails(user: UserDataDTO): Promise<any[]> {
    try {
      const filters: {
        user_id?: number;
        organization_id?: number;
        role?: string;
      } = {};

      if (user.role === "admin") {
        filters.role = "admin";
        filters.organization_id = user.organization_id;
      } else if (user.role === "manager") {
        filters.role = "manager";
        filters.user_id = user.id;
      } else if (user.role === "user") {
        filters.role = "user";
      }

      const agreements = await this.agreementRepo.findAllWithDetails(filters);
      return agreements;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new ServiceError(
        "Не удалось получить список договоров",
        "AgreementService",
        "findAllWithDetails",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async findByIdWithDetails(id: number): Promise<any | null> {
    try {
      const agreement = await this.agreementRepo.findByIdWithDetails(id);
      if (!agreement) {
        throw new NotFoundError(
          `Договор с ID ${id} не найден`,
          "Agreement",
          "findByIdWithDetails",
          id,
        );
      }
      return agreement;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError(
        `Не удалось найти договор с ID ${id}`,
        "AgreementService",
        "findByIdWithDetails",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
