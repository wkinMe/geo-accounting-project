// services/MaterialService.ts
import { Material } from "../domain/entities/Material";
import { MaterialRepository } from "../repositories/MaterialRepository";
import { MaterialImageRepository } from "../repositories/MaterialImageRepository";
import { CreateMaterialDTO, UpdateMaterialDTO } from "@shared/dto";
import { ValidationError, NotFoundError } from "@shared/service";

export class MaterialService {
  constructor(
    private materialRepo: MaterialRepository,
    private imageRepo: MaterialImageRepository,
  ) {}

  async findAll(): Promise<Material[]> {
    return await this.materialRepo.findAll();
  }

  async findById(id: number): Promise<Material> {
    const material = await this.materialRepo.findById(id);

    if (!material) {
      throw new NotFoundError(
        `Материал с ID ${id} не найден`,
        "Material",
        "findById",
        id,
      );
    }

    return material;
  }

  async create(dto: CreateMaterialDTO): Promise<Material> {
    this.validateCreateDTO(dto);

    const existing = await this.materialRepo.findByName(dto.name);
    if (existing) {
      throw new ValidationError(
        `Материал с названием "${dto.name}" уже существует`,
        "create",
        "name",
        dto.name,
      );
    }

    const hasImage = !!(dto.image && dto.image.length > 0);
    const material = Material.create(dto.name, dto.unit, hasImage);
    const savedMaterial = await this.materialRepo.save(material);

    if (dto.image && dto.image.length > 0) {
      const imageBuffer =
        dto.image instanceof Uint8Array ? Buffer.from(dto.image) : dto.image;

      await this.imageRepo.upsertImage(savedMaterial.id!, imageBuffer);
    }

    return savedMaterial;
  }

  async update(id: number, dto: UpdateMaterialDTO): Promise<Material> {
    const existingMaterial = await this.findById(id);

    if (dto.name !== undefined) {
      existingMaterial.updateName(dto.name);

      const duplicate = await this.materialRepo.findByName(dto.name, id);
      if (duplicate) {
        throw new ValidationError(
          `Материал с названием "${dto.name}" уже существует`,
          "update",
          "name",
          dto.name,
        );
      }
    }

    if (dto.unit !== undefined) {
      existingMaterial.updateUnit(dto.unit);
    }

    const updatedMaterial = await this.materialRepo.update(
      id,
      existingMaterial,
    );

    if (dto.image !== undefined) {
      if (dto.image === null) {
        await this.imageRepo.deleteImage(id);
        updatedMaterial.has_image = false;
      } else if (dto.image.length > 0) {
        const imageBuffer =
          dto.image instanceof Uint8Array ? Buffer.from(dto.image) : dto.image;
        await this.imageRepo.upsertImage(id, imageBuffer);
        updatedMaterial.has_image = true;
      }
    }

    return updatedMaterial;
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.imageRepo.deleteImage(id);
    await this.materialRepo.delete(id);
  }

  async search(query: string): Promise<Material[]> {
    if (!query || query.trim().length === 0) {
      return await this.findAll();
    }

    return await this.materialRepo.search(query.trim());
  }

  async getImage(materialId: number): Promise<Buffer | null> {
    await this.findById(materialId);
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

  private validateCreateDTO(dto: CreateMaterialDTO): void {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new ValidationError(
        "Название материала не может быть пустым",
        "create",
        "name",
        dto.name,
      );
    }

    if (dto.name.length > 255) {
      throw new ValidationError(
        "Название материала не может превышать 255 символов",
        "create",
        "name",
        dto.name,
      );
    }

    if (!dto.unit || dto.unit.trim().length === 0) {
      throw new ValidationError(
        "Единица измерения не может быть пустой",
        "create",
        "unit",
        dto.unit,
      );
    }

    if (dto.unit.length > 50) {
      throw new ValidationError(
        "Единица измерения не может превышать 50 символов",
        "create",
        "unit",
        dto.unit,
      );
    }
  }
}
