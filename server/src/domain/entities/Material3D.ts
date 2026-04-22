// domain/entities/Material3D.ts
export class Material3D {
  constructor(
    public readonly id: number | undefined,
    public readonly materialId: number,
    public format: string,
    public modelData: Buffer,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  updateFormat(newFormat: string): void {
    if (!newFormat || newFormat.trim().length === 0) {
      throw new Error("Format cannot be empty");
    }
    this.format = newFormat.trim();
    this.updatedAt = new Date();
  }

  updateModelData(newData: Buffer): void {
    if (!newData || newData.length === 0) {
      throw new Error("Model data cannot be empty");
    }
    this.modelData = newData;
    this.updatedAt = new Date();
  }

  static create(
    materialId: number,
    format: string,
    modelData: Buffer
  ): Material3D {
    const now = new Date();
    return new Material3D(
      undefined,
      materialId,
      format,
      modelData,
      now,
      now
    );
  }

  toJSON() {
    return {
      id: this.id,
      materialId: this.materialId,
      format: this.format,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Не возвращаем model_data в JSON, только URL для скачивания
    };
  }
}