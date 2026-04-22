// domain/entities/Material.ts
export class Material {
  constructor(
    public readonly id: number | undefined,
    private _name: string,
    private _unit: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public hasImage: boolean = false,
  ) {}

  get name(): string {
    return this._name;
  }

  get unit(): string {
    return this._unit;
  }

  // Бизнес-логика валидации
  updateName(newName: string): void {
    const trimmedName = newName?.trim();
    if (!trimmedName || trimmedName.length === 0) {
      throw new Error("Material name cannot be empty");
    }
    if (trimmedName.length > 255) {
      throw new Error("Material name cannot exceed 255 characters");
    }
    this._name = trimmedName;
    this.updatedAt = new Date();
  }

  updateUnit(newUnit: string): void {
    const trimmedUnit = newUnit?.trim();
    if (!trimmedUnit || trimmedUnit.length === 0) {
      throw new Error("Material unit cannot be empty");
    }
    if (trimmedUnit.length > 50) {
      throw new Error("Material unit cannot exceed 50 characters");
    }
    this._unit = trimmedUnit;
    this.updatedAt = new Date();
  }

  static create(
    name: string,
    unit: string,
    hasImage: boolean = false,
  ): Material {
    const now = new Date();
    const material = new Material(undefined, name, unit, now, now, hasImage);
    material.updateName(name);
    material.updateUnit(unit);
    return material;
  }

  // Преобразование в JSON для ответа API
  toJSON() {
    return {
      id: this.id,
      name: this._name,
      unit: this._unit,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      hasImage: this.hasImage,
    };
  }
}
