// domain/entities/Material.ts
export class Material {
  constructor(
    public readonly id: number | undefined,
    private _name: string,
    private _unit: string,
    public readonly created_at: Date,
    public updated_at: Date,
    public has_image: boolean = false,
  ) {}

  get name(): string {
    return this._name;
  }

  get unit(): string {
    return this._unit;
  }

  updateName(newName: string): void {
    const trimmedName = newName?.trim();
    if (!trimmedName || trimmedName.length === 0) {
      throw new Error("Название материала не может быть пустым");
    }
    if (trimmedName.length > 255) {
      throw new Error("Название материала не может превышать 255 символов");
    }
    this._name = trimmedName;
    this.updated_at = new Date();
  }

  updateUnit(newUnit: string): void {
    const trimmedUnit = newUnit?.trim();
    if (!trimmedUnit || trimmedUnit.length === 0) {
      throw new Error("Единица измерения не может быть пустой");
    }
    if (trimmedUnit.length > 50) {
      throw new Error("Единица измерения не может превышать 50 символов");
    }
    this._unit = trimmedUnit;
    this.updated_at = new Date();
  }

  static create(
    name: string,
    unit: string,
    has_image: boolean = false,
  ): Material {
    const now = new Date();
    const material = new Material(undefined, name, unit, now, now, has_image);
    material.updateName(name);
    material.updateUnit(unit);
    return material;
  }

  toJSON() {
    return {
      id: this.id,
      name: this._name,
      unit: this._unit,
      created_at: this.created_at,
      updated_at: this.updated_at,
      has_image: this.has_image,
    };
  }
}
