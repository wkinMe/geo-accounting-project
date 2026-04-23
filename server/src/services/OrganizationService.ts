// services/OrganizationService.ts
import { Organization } from "../domain/entities/Organization";
import { OrganizationRepository } from "../repositories/OrganizationRepository";
import { CreateOrganizationDTO, UpdateOrganizationDTO } from "@shared/dto";
import { USER_ROLES } from "@shared/constants";
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
        `Организация с ID ${id} не найдена`,
        "Organization",
        "findById",
        id,
      );
    }
    return organization;
  }

  async create(dto: CreateOrganizationDTO): Promise<Organization> {
    this.validateCreateDTO(dto);

    const existing = await this.organizationRepo.findByName(dto.name);
    if (existing) {
      throw new ValidationError(
        `Организация с названием "${dto.name}" уже существует`,
        "create",
        "name",
        dto.name,
      );
    }

    const organization = Organization.create(
      dto.name,
      dto.latitude,
      dto.longitude,
    );
    return await this.organizationRepo.save(organization);
  }

  async update(id: number, dto: UpdateOrganizationDTO): Promise<Organization> {
    const existingOrganization = await this.findById(id);
    this.validateUpdateDTO(dto);

    if (dto.name !== undefined) {
      existingOrganization.updateName(dto.name);
      const duplicate = await this.organizationRepo.findByName(dto.name, id);
      if (duplicate) {
        throw new ValidationError(
          `Организация с названием "${dto.name}" уже существует`,
          "update",
          "name",
          dto.name,
        );
      }
    }

    if (dto.latitude !== undefined || dto.longitude !== undefined) {
      existingOrganization.updateCoordinates(dto.latitude, dto.longitude);
    }

    return await this.organizationRepo.update(id, existingOrganization);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.organizationRepo.delete(id);
  }

  async search(query: string): Promise<Organization[]> {
    if (!query || query.trim().length === 0) {
      return await this.findAll();
    }
    return await this.organizationRepo.search(query.trim());
  }

  async canAssignAdminRole(organizationId: number): Promise<boolean> {
    return await this.organizationRepo.hasSuperAdmin(organizationId);
  }

  async canRemoveSuperAdmin(organizationId: number): Promise<boolean> {
    const count =
      await this.organizationRepo.getSuperAdminCount(organizationId);
    return count > 1;
  }

  async getSuperAdminCount(organizationId: number): Promise<number> {
    return await this.organizationRepo.getSuperAdminCount(organizationId);
  }

  private validateCreateDTO(dto: CreateOrganizationDTO): void {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new ValidationError(
        "Название организации обязательно",
        "create",
        "name",
        dto.name,
      );
    }
    if (dto.name.length > 255) {
      throw new ValidationError(
        "Название организации не может превышать 255 символов",
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
        "Название организации не может быть пустым",
        "update",
        "name",
        dto.name,
      );
    }
    if (dto.name !== undefined && dto.name.length > 255) {
      throw new ValidationError(
        "Название организации не может превышать 255 символов",
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
        "Широта должна быть в диапазоне от -90 до 90",
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
        "Долгота должна быть в диапазоне от -180 до 180",
        "validateCoordinates",
        "longitude",
        longitude.toString(),
      );
    }
  }
}
