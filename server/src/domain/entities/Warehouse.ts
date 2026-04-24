// domain/entities/Warehouse.ts
export class Warehouse {
  constructor(
    public readonly id: number | undefined,
    private _name: string,
    private _organization_id: number,
    private _manager_id: number | null,
    private _latitude: number,
    private _longitude: number,
    public readonly created_at: Date,
    public updated_at: Date,
  ) {}

  get name(): string {
    return this._name;
  }

  get organization_id(): number {
    return this._organization_id;
  }

  get manager_id(): number | null {
    return this._manager_id;
  }

  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }

  updateName(newName: string): void {
    const trimmedName = newName?.trim();
    if (!trimmedName || trimmedName.length === 0) {
      throw new Error("Название склада не может быть пустым");
    }
    if (trimmedName.length > 255) {
      throw new Error("Название склада не может превышать 255 символов");
    }
    this._name = trimmedName;
    this.updated_at = new Date();
  }

  updateManager(managerId: number | null): void {
    this._manager_id = managerId;
    this.updated_at = new Date();
  }

  updateCoordinates(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90) {
      throw new Error("Широта должна быть в диапазоне от -90 до 90");
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error("Долгота должна быть в диапазоне от -180 до 180");
    }
    this._latitude = latitude;
    this._longitude = longitude;
    this.updated_at = new Date();
  }

  static create(
    name: string,
    organization_id: number,
    latitude: number,
    longitude: number,
    manager_id?: number | null,
  ): Warehouse {
    const now = new Date();
    const warehouse = new Warehouse(
      undefined,
      name,
      organization_id,
      manager_id || null,
      latitude,
      longitude,
      now,
      now,
    );
    warehouse.updateName(name);
    warehouse.updateCoordinates(latitude, longitude);
    return warehouse;
  }

  toJSON() {
    return {
      id: this.id,
      name: this._name,
      organization_id: this._organization_id,
      manager_id: this._manager_id,
      latitude: this._latitude,
      longitude: this._longitude,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
