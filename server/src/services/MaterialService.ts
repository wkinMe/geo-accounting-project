// services/MaterialService.ts
import { Material } from "../domain/entities/Material";
import { MaterialRepository } from "../repositories/MaterialRepository";
import { MaterialImageRepository } from "../repositories/MaterialImageRepository";
import { CreateMaterialDTO, UpdateMaterialDTO } from "@shared/dto";
import { ValidationError, NotFoundError } from "@shared/service";

export class MaterialService {
  constructor(
    private materialRepo: MaterialRepository,
    private imageRepo: MaterialImageRepository
  ) {}

  async findAll(): Promise<Material[]> {
    return await this.materialRepo.findAll();
  }

  async findById(id: number): Promise<Material> {
    const material = await this.materialRepo.findById(id);
    
    if (!material) {
      throw new NotFoundError(`Material with id ${id} not found`, "Material", "findById", id);
    }
    
    return material;
  }

  async create(dto: CreateMaterialDTO): Promise<Material> {
    // Валидация
    this.validateCreateDTO(dto);
    
    // Проверка уникальности имени
    const existing = await this.materialRepo.findByName(dto.name);
    if (existing) {
      throw new ValidationError(
        `Material with name "${dto.name}" already exists`,
        "create",
        "name",
        dto.name
      );
    }
    
    // Создаем сущность
    const hasImage = !!(dto.image && dto.image.length > 0);
    const material = Material.create(dto.name, dto.unit, hasImage);
    
    // Сохраняем
    const savedMaterial = await this.materialRepo.save(material);
    
    // Сохраняем изображение если есть
    if (dto.image && dto.image.length > 0) {
      const imageBuffer = dto.image instanceof Uint8Array 
        ? Buffer.from(dto.image) 
        : dto.image;
      
      await this.imageRepo.upsertImage(savedMaterial.id!, imageBuffer);
    }
    
    return savedMaterial;
  }

  async update(id: number, dto: UpdateMaterialDTO): Promise<Material> {
    // Проверяем существование
    const existingMaterial = await this.findById(id);
    
    // Обновляем сущность
    if (dto.name !== undefined) {
      existingMaterial.updateName(dto.name);
      
      // Проверяем уникальность нового имени
      const duplicate = await this.materialRepo.findByName(dto.name, id);
      if (duplicate) {
        throw new ValidationError(
          `Material with name "${dto.name}" already exists`,
          "update",
          "name",
          dto.name
        );
      }
    }
    
    if (dto.unit !== undefined) {
      existingMaterial.updateUnit(dto.unit);
    }
    
    // Сохраняем изменения
    const updatedMaterial = await this.materialRepo.update(id, existingMaterial);
    
    // Обрабатываем изображение
    if (dto.image !== undefined) {
      if (dto.image === null) {
        await this.imageRepo.deleteImage(id);
        updatedMaterial.hasImage = false;
      } else if (dto.image.length > 0) {
        const imageBuffer = dto.image instanceof Uint8Array 
          ? Buffer.from(dto.image) 
          : dto.image;
        await this.imageRepo.upsertImage(id, imageBuffer);
        updatedMaterial.hasImage = true;
      }
    }
    
    return updatedMaterial;
  }

  async delete(id: number): Promise<void> {
    // Проверяем существование
    await this.findById(id);
    
    // Удаляем изображение
    await this.imageRepo.deleteImage(id);
    
    // Удаляем материал
    await this.materialRepo.delete(id);
  }

  async search(query: string): Promise<Material[]> {
    if (!query || query.trim().length === 0) {
      return await this.findAll();
    }
    
    return await this.materialRepo.search(query.trim());
  }

  // ========== Работа с изображениями ==========
  
  async getImage(materialId: number): Promise<Buffer | null> {
    await this.findById(materialId); // Проверяем существование материала
    return await this.imageRepo.getImage(materialId);
  }

  async upsertImage(materialId: number, imageData: Buffer): Promise<void> {
    await this.findById(materialId);
    await this.imageRepo.upsertImage(materialId, imageData);
  }

  async deleteImage(materialId: number): Promise<void> {
    await this.findById(materialId);
    await this.imageRepo.deleteImage(materialId);
  }

  async imageExists(materialId: number): Promise<boolean> {
    await this.findById(materialId);
    return await this.imageRepo.imageExists(materialId);
  }

  // ========== Private validation methods ==========
  
  private validateCreateDTO(dto: CreateMaterialDTO): void {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new ValidationError("Material name cannot be empty", "create", "name", dto.name);
    }
    
    if (dto.name.length > 255) {
      throw new ValidationError("Material name cannot exceed 255 characters", "create", "name", dto.name);
    }
    
    if (!dto.unit || dto.unit.trim().length === 0) {
      throw new ValidationError("Material unit cannot be empty", "create", "unit", dto.unit);
    }
    
    if (dto.unit.length > 50) {
      throw new ValidationError("Material unit cannot exceed 50 characters", "create", "unit", dto.unit);
    }
  }
}