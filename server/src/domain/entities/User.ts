// domain/entities/User.ts
import { UserRole } from "@shared/models";

export class User {
  constructor(
    public readonly id: number | undefined,
    private _name: string,
    private _password: string,
    private _role: UserRole,
    private _organization_id: number | null,
    public readonly created_at: Date,
    public updated_at: Date,
  ) {}

  get name(): string {
    return this._name;
  }

  get password(): string {
    return this._password;
  }

  get role(): UserRole {
    return this._role;
  }

  get organization_id(): number | null {
    return this._organization_id;
  }

  updateName(newName: string): void {
    const trimmedName = newName?.trim();
    if (!trimmedName || trimmedName.length === 0) {
      throw new Error("Имя пользователя не может быть пустым");
    }
    if (trimmedName.length > 255) {
      throw new Error("Имя пользователя не может превышать 255 символов");
    }
    this._name = trimmedName;
    this.updated_at = new Date();
  }

  updatePassword(newPassword: string): void {
    if (!newPassword || newPassword.trim().length === 0) {
      throw new Error("Пароль не может быть пустым");
    }
    if (newPassword.length < 6) {
      throw new Error("Пароль должен содержать минимум 6 символов");
    }
    this._password = newPassword;
    this.updated_at = new Date();
  }

  updateRole(newRole: UserRole): void {
    this._role = newRole;
    this.updated_at = new Date();
  }

  updateOrganization(organization_id: number | null): void {
    this._organization_id = organization_id;
    this.updated_at = new Date();
  }

  static create(
    name: string,
    hashedPassword: string,
    role: UserRole,
    organization_id?: number | null,
  ): User {
    const now = new Date();
    const user = new User(
      undefined,
      name,
      hashedPassword,
      role,
      organization_id || null,
      now,
      now,
    );
    user.updateName(name);
    return user;
  }

  toJSON() {
    return {
      id: this.id,
      name: this._name,
      role: this._role,
      organization_id: this._organization_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
