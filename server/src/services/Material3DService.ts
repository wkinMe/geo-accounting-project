// services/Material3DService.ts
import { Material3D } from "../domain/entities/Material3D";
import { Material3DRepository } from "../repositories/Material3DRepository";
import { MaterialRepository } from "../repositories/MaterialRepository";
import { CreateMaterial3DDTO, UpdateMaterial3DDTO } from "@shared/dto";
import { ValidationError, NotFoundError } from "@shared/service";

export class Material3DService {
  constructor(
    private material3DRepo: Material3DRepository,
    private materialRepo: MaterialRepository,
  ) {}

  async findByMaterialId(materialId: number): Promise<Material3D | null> {
    // Проверяем существование материала
    const material = await this.materialRepo.findById(materialId);
    if (!material) {
      throw new NotFoundError(
        `Material with id ${materialId} not found`,
        "Material",
        "findByMaterialId",
        materialId,
      );
    }

    return await this.material3DRepo.findByMaterialId(materialId);
  }

  async create(dto: CreateMaterial3DDTO): Promise<Material3D> {
    // Валидация
    this.validateCreateDTO(dto);

    // Проверяем существование материала
    const material = await this.materialRepo.findById(dto.materialId);
    if (!material) {
      throw new NotFoundError(
        `Material with id ${dto.materialId} not found`,
        "Material",
        "create",
        dto.materialId,
      );
    }

    // Проверяем, нет ли уже 3D объекта для этого материала
    const existing = await this.material3DRepo.findByMaterialId(dto.materialId);
    if (existing) {
      throw new ValidationError(
        `3D object already exists for material ${dto.materialId}`,
        "create",
        "materialId",
        dto.materialId.toString(),
      );
    }

    // Создаем сущность
    const material3D = Material3D.create(
      dto.materialId,
      dto.format,
      dto.modelData,
    );

    // Сохраняем
    return await this.material3DRepo.save(material3D);
  }

  async update(
    materialId: number,
    dto: UpdateMaterial3DDTO,
  ): Promise<Material3D> {
    // Находим существующий объект
    const existing = await this.material3DRepo.findByMaterialId(materialId);
    if (!existing) {
      throw new NotFoundError(
        `3D object for material ${materialId} not found`,
        "Material3D",
        "update",
        materialId,
      );
    }

    // Обновляем сущность
    if (dto.format) {
      existing.updateFormat(dto.format);
    }

    if (dto.modelData) {
      existing.updateModelData(dto.modelData);
    }

    // Сохраняем изменения
    return await this.material3DRepo.update(materialId, existing);
  }

  async delete(materialId: number): Promise<void> {
    // Проверяем существование материала
    const material = await this.materialRepo.findById(materialId);
    if (!material) {
      throw new NotFoundError(
        `Material with id ${materialId} not found`,
        "Material",
        "delete",
        materialId,
      );
    }

    // Удаляем 3D объект
    await this.material3DRepo.delete(materialId);
  }

  async getModelData(materialId: number): Promise<Buffer | null> {
    const material3D = await this.findByMaterialId(materialId);
    return material3D?.modelData || null;
  }

  // Private validation
  private validateCreateDTO(dto: CreateMaterial3DDTO): void {
    if (!dto.materialId || dto.materialId <= 0) {
      throw new ValidationError(
        "Valid material ID is required",
        "create",
        "materialId",
        dto.materialId?.toString(),
      );
    }

    if (!dto.format || dto.format.trim().length === 0) {
      throw new ValidationError(
        "Format is required (e.g., 'gltf', 'obj', 'fbx')",
        "create",
        "format",
        dto.format,
      );
    }

    const allowedFormats = ["gltf", "glb", "obj", "fbx", "stl"];
    if (!allowedFormats.includes(dto.format.toLowerCase())) {
      throw new ValidationError(
        `Format must be one of: ${allowedFormats.join(", ")}`,
        "create",
        "format",
        dto.format,
      );
    }

    if (!dto.modelData || dto.modelData.length === 0) {
      throw new ValidationError(
        "Model data is required",
        "create",
        "modelData",
        "empty",
      );
    }

    // Максимальный размер 50MB
    const maxSize = 50 * 1024 * 1024;
    if (dto.modelData.length > maxSize) {
      throw new ValidationError(
        `Model data too large. Max ${maxSize / 1024 / 1024}MB`,
        "create",
        "modelData",
        `${dto.modelData.length} bytes`,
      );
    }
  }
}
