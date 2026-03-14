// shared/models/User.ts
import { BaseModel } from "./Base";
import { Organization } from "./Organization";

export type UserRole = "super_admin" | "admin" | "manager" | "user";

export interface User extends BaseModel {
  name: string;
  organization_id: number;
  password: string;
  role: UserRole;
}

export interface UserWithOrganization extends User {
  organization?: Organization;
}
