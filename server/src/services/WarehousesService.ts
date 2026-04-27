// services/WarehouseService.ts
import { Warehouse } from "../domain/entities/Warehouse";
import { WarehouseRepository } from "../repositories/WarehouseRepository";
import { OrganizationRepository } from "../repositories/OrganizationRepository";
import { UserRepository } from "../repositories/UserRepository";
import { CreateWarehouseDTO, UpdateWarehouseDTO } from "@shared/dto";
import { ValidationError, NotFoundError } from "@shared/service";
import { WarehouseWithManagerAndOrganization } from "@shared/models";

export class WarehouseService {
  constructor(
    private warehouseRepo: WarehouseRepository,
    private organizationRepo: OrganizationRepository,
    private userRepo: UserRepository,
  ) {}

  async findAll(organization_id?: number): Promise<Warehouse[]> {
    return await this.warehouseRepo.findAll(organization_id);
  }

  async findAllWithDetails(
    organization_id?: number,
  ): Promise<WarehouseWithManagerAndOrganization[]> {
    return await this.warehouseRepo.findAllWithDetails(organization_id);
  }

  async findById(id: number): Promise<Warehouse> {
    const warehouse = await this.warehouseRepo.findById(id);
    if (!warehouse) {
      throw new NotFoundError(
        `Склад с ID ${id} не найден`,
        "Warehouse",
        "findById",
        id,
      );
    }
    return warehouse;
  }

  async create(dto: CreateWarehouseDTO): Promise<Warehouse> {
    this.validateCreateDTO(dto);

    const organization = await this.organizationRepo.findById(
      dto.organization_id,
    );
    if (!organization) {
      throw new NotFoundError(
        `Организация с ID ${dto.organization_id} не найдена`,
        "Organization",
        "create",
        dto.organization_id,
      );
    }

    if (dto.manager_id) {
      const manager = await this.userRepo.findById(dto.manager_id);
      if (!manager) {
        throw new NotFoundError(
          `Менеджер с ID ${dto.manager_id} не найден`,
          "User",
          "create",
          dto.manager_id,
        );
      }
    }

    const existing = await this.warehouseRepo.findByName(
      dto.name,
      dto.organization_id,
    );
    if (existing) {
      throw new ValidationError(
        `Склад с названием "${dto.name}" уже существует в этой организации`,
        "create",
        "name",
        dto.name,
      );
    }

    const warehouse = Warehouse.create(
      dto.name,
      dto.organization_id,
      dto.latitude,
      dto.longitude,
      dto.manager_id,
    );

    return await this.warehouseRepo.save(warehouse);
  }

  async update(id: number, dto: UpdateWarehouseDTO): Promise<Warehouse> {
    const existingWarehouse = await this.findById(id);
    this.validateUpdateDTO(dto);

    if (
      dto.organization_id !== undefined &&
      dto.organization_id !== existingWarehouse.organization_id
    ) {
      const organization = await this.organizationRepo.findById(
        dto.organization_id,
      );
      if (!organization) {
        throw new NotFoundError(
          `Организация с ID ${dto.organization_id} не найдена`,
          "Organization",
          "update",
          dto.organization_id,
        );
      }
    }

    if (dto.manager_id !== undefined) {
      if (dto.manager_id !== null) {
        const manager = await this.userRepo.findById(dto.manager_id);
        if (!manager) {
          throw new NotFoundError(
            `Менеджер с ID ${dto.manager_id} не найден`,
            "User",
            "update",
            dto.manager_id,
          );
        }
      }
      existingWarehouse.updateManager(dto.manager_id);
    }

    if (dto.name !== undefined) {
      existingWarehouse.updateName(dto.name);
      const duplicate = await this.warehouseRepo.findByName(
        dto.name,
        existingWarehouse.organization_id,
        id,
      );
      if (duplicate) {
        throw new ValidationError(
          `Склад с названием "${dto.name}" уже существует в этой организации`,
          "update",
          "name",
          dto.name,
        );
      }
    }

    if (dto.latitude !== undefined || dto.longitude !== undefined) {
      const latitude = dto.latitude ?? existingWarehouse.latitude;
      const longitude = dto.longitude ?? existingWarehouse.longitude;
      existingWarehouse.updateCoordinates(latitude, longitude);
    }

    return await this.warehouseRepo.update(id, existingWarehouse);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);

    const usage = await this.warehouseRepo.checkUsageInAgreements(id);
    if (usage.as_supplier > 0 || usage.as_customer > 0) {
      throw new ValidationError(
        `Нельзя удалить склад, так как он используется в договорах (поставщик: ${usage.as_supplier}, покупатель: ${usage.as_customer})`,
        "delete",
        "id",
        id.toString(),
      );
    }

    const hasMaterials = await this.warehouseRepo.checkHasMaterials(id);
    if (hasMaterials) {
      throw new ValidationError(
        "Нельзя удалить склад, так как на нём есть материалы. Сначала удалите все материалы со склада.",
        "delete",
        "id",
        id.toString(),
      );
    }

    await this.warehouseRepo.delete(id);
  }

  async findByManagerId(manager_id: number): Promise<Warehouse[]> {
    const manager = await this.userRepo.findById(manager_id);
    if (!manager) {
      throw new NotFoundError(
        `Менеджер с ID ${manager_id} не найден`,
        "User",
        "findByManagerId",
        manager_id,
      );
    }
    return await this.warehouseRepo.findByManagerId(manager_id);
  }

  async assignManager(
    warehouse_id: number,
    manager_id: number | null,
  ): Promise<Warehouse> {
    const warehouse = await this.findById(warehouse_id);

    if (manager_id !== null) {
      const manager = await this.userRepo.findById(manager_id);
      if (!manager) {
        throw new NotFoundError(
          `Менеджер с ID ${manager_id} не найден`,
          "User",
          "assignManager",
          manager_id,
        );
      }
    }

    warehouse.updateManager(manager_id);
    return await this.warehouseRepo.update(warehouse_id, warehouse);
  }

  private validateCreateDTO(dto: CreateWarehouseDTO): void {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new ValidationError(
        "Название склада обязательно",
        "create",
        "name",
        dto.name,
      );
    }

    if (dto.name.length > 255) {
      throw new ValidationError(
        "Название склада не может превышать 255 символов",
        "create",
        "name",
        dto.name,
      );
    }

    if (!dto.organization_id) {
      throw new ValidationError(
        "ID организации обязательно",
        "create",
        "organization_id",
        dto.organization_id?.toString(),
      );
    }

    if (dto.latitude === undefined || dto.latitude === null) {
      throw new ValidationError(
        "Широта обязательна",
        "create",
        "latitude",
        dto.latitude?.toString(),
      );
    }

    if (dto.longitude === undefined || dto.longitude === null) {
      throw new ValidationError(
        "Долгота обязательна",
        "create",
        "longitude",
        dto.longitude?.toString(),
      );
    }

    if (dto.latitude < -90 || dto.latitude > 90) {
      throw new ValidationError(
        "Широта должна быть в диапазоне от -90 до 90",
        "create",
        "latitude",
        dto.latitude.toString(),
      );
    }

    if (dto.longitude < -180 || dto.longitude > 180) {
      throw new ValidationError(
        "Долгота должна быть в диапазоне от -180 до 180",
        "create",
        "longitude",
        dto.longitude.toString(),
      );
    }
  }

  private validateUpdateDTO(dto: UpdateWarehouseDTO): void {
    if (dto.name !== undefined && dto.name.trim().length === 0) {
      throw new ValidationError(
        "Название склада не может быть пустым",
        "update",
        "name",
        dto.name,
      );
    }

    if (dto.name !== undefined && dto.name.length > 255) {
      throw new ValidationError(
        "Название склада не может превышать 255 символов",
        "update",
        "name",
        dto.name,
      );
    }

    if (
      dto.latitude !== undefined &&
      (dto.latitude < -90 || dto.latitude > 90)
    ) {
      throw new ValidationError(
        "Широта должна быть в диапазоне от -90 до 90",
        "update",
        "latitude",
        dto.latitude.toString(),
      );
    }

    if (
      dto.longitude !== undefined &&
      (dto.longitude < -180 || dto.longitude > 180)
    ) {
      throw new ValidationError(
        "Долгота должна быть в диапазоне от -180 до 180",
        "update",
        "longitude",
        dto.longitude.toString(),
      );
    }
  }

  async search(query: string, organization_id?: number): Promise<Warehouse[]> {
    if (!query || query.trim().length === 0) {
      return await this.findAll(organization_id);
    }
    return await this.warehouseRepo.search(query.trim(), organization_id);
  }
}
