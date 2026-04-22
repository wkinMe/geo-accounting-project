// domain/entities/Organization.ts
export class Organization {
  constructor(
    public readonly id: number | undefined,
    private _name: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
    private _latitude?: number | null,
    private _longitude?: number | null,
  ) {}

  get name(): string {
    return this._name;
  }

  get latitude(): number | null | undefined {
    return this._latitude;
  }

  get longitude(): number | null | undefined {
    return this._longitude;
  }

  // Бизнес-методы
  updateName(newName: string): void {
    const trimmedName = newName?.trim();
    if (!trimmedName || trimmedName.length === 0) {
      throw new Error("Organization name cannot be empty");
    }
    if (trimmedName.length > 255) {
      throw new Error("Organization name cannot exceed 255 characters");
    }
    this._name = trimmedName;
    this.updatedAt = new Date();
  }

  updateCoordinates(latitude?: number | null, longitude?: number | null): void {
    if (latitude !== undefined && latitude !== null) {
      if (latitude < -90 || latitude > 90) {
        throw new Error("Latitude must be between -90 and 90");
      }
      this._latitude = latitude;
    }

    if (longitude !== undefined && longitude !== null) {
      if (longitude < -180 || longitude > 180) {
        throw new Error("Longitude must be between -180 and 180");
      }
      this._longitude = longitude;
    }

    this.updatedAt = new Date();
  }

  static create(
    name: string,
    latitude?: number | null,
    longitude?: number | null,
  ): Organization {
    const now = new Date();
    const organization = new Organization(
      undefined,
      name,
      now,
      now,
      latitude,
      longitude,
    );
    organization.updateName(name);
    organization.updateCoordinates(latitude, longitude);
    return organization;
  }

  toJSON() {
    return {
      id: this.id,
      name: this._name,
      latitude: this._latitude,
      longitude: this._longitude,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
