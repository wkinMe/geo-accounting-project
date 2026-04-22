// services/OrganizationService.ts
import { Organization } from "../domain/entities/Organization";
import { OrganizationRepository } from "../repositories/OrganizationRepository";
import { CreateOrganizationDTO, UpdateOrganizationDTO } from "@shared/dto";
import { ValidationError, NotFoundError } from "@shared/service";

export class OrganizationService {
  constructor(private organizationRepo: OrganizationRepository) {}

  async findAll(): Promise<Organization[]> {
    return await this.organizationRepo.findAll();
  }

  async findById(id: number): Promise<Organization> {
    const organization = await this.organizationRepo.findById(id);

    if (!organization) {
      throw new NotFoundError(
        `Organization with id ${id} not found`,
        "Organization",
        "findById",
        id,
      );
    }

    return organization;
  }

  async create(dto: CreateOrganizationDTO): Promise<Organization> {
    this.validateCreateDTO(dto);

    // Проверка уникальности имени
    const existing = await this.organizationRepo.findByName(dto.name);
    if (existing) {
      throw new ValidationError(
        `Organization with name "${dto.name}" already exists`,
        "create",
        "name",
        dto.name,
      );
    }

    // Создаем сущность
    const organization = Organization.create(
      dto.name,
      dto.latitude,
      dto.longitude,
    );

    // Сохраняем
    return await this.organizationRepo.save(organization);
  }

  async update(id: number, dto: UpdateOrganizationDTO): Promise<Organization> {
    // Проверяем существование
    const existingOrganization = await this.findById(id);

    // Валидация
    this.validateUpdateDTO(dto);

    // Обновляем сущность
    if (dto.name !== undefined) {
      existingOrganization.updateName(dto.name);

      // Проверяем уникальность нового имени
      const duplicate = await this.organizationRepo.findByName(dto.name, id);
      if (duplicate) {
        throw new ValidationError(
          `Organization with name "${dto.name}" already exists`,
          "update",
          "name",
          dto.name,
        );
      }
    }

    if (dto.latitude !== undefined || dto.longitude !== undefined) {
      existingOrganization.updateCoordinates(dto.latitude, dto.longitude);
    }

    // Сохраняем изменения
    return await this.organizationRepo.update(id, existingOrganization);
  }

  async delete(id: number): Promise<void> {
    // Проверяем существование
    await this.findById(id);

    // TODO: Проверить, нет ли связанных складов
    // const warehousesCount = await this.warehouseRepo.countByOrganization(id);
    // if (warehousesCount > 0) {
    //   throw new ValidationError("Cannot delete organization with existing warehouses");
    // }

    // Удаляем
    await this.organizationRepo.delete(id);
  }

  async search(query: string): Promise<Organization[]> {
    if (!query || query.trim().length === 0) {
      return await this.findAll();
    }

    return await this.organizationRepo.search(query.trim());
  }

  // ========== Private validation methods ==========

  private validateCreateDTO(dto: CreateOrganizationDTO): void {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new ValidationError(
        "Organization name is required",
        "create",
        "name",
        dto.name,
      );
    }

    if (dto.name.length > 255) {
      throw new ValidationError(
        "Organization name cannot exceed 255 characters",
        "create",
        "name",
        dto.name,
      );
    }

    this.validateCoordinates(dto.latitude, dto.longitude);
  }

  private validateUpdateDTO(dto: UpdateOrganizationDTO): void {
    if (dto.name !== undefined && dto.name.trim().length === 0) {
      throw new ValidationError(
        "Organization name cannot be empty",
        "update",
        "name",
        dto.name,
      );
    }

    if (dto.name !== undefined && dto.name.length > 255) {
      throw new ValidationError(
        "Organization name cannot exceed 255 characters",
        "update",
        "name",
        dto.name,
      );
    }

    this.validateCoordinates(dto.latitude, dto.longitude);
  }

  private validateCoordinates(
    latitude?: number | null,
    longitude?: number | null,
  ): void {
    if (
      latitude !== undefined &&
      latitude !== null &&
      (latitude < -90 || latitude > 90)
    ) {
      throw new ValidationError(
        "Latitude must be between -90 and 90",
        "validateCoordinates",
        "latitude",
        latitude.toString(),
      );
    }

    if (
      longitude !== undefined &&
      longitude !== null &&
      (longitude < -180 || longitude > 180)
    ) {
      throw new ValidationError(
        "Longitude must be between -180 and 180",
        "validateCoordinates",
        "longitude",
        longitude.toString(),
      );
    }
  }
}
