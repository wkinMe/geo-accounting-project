import { BaseModel } from "./Base";
import { Organization } from "./Organization";

export interface User extends BaseModel {
  name: string;
  org_id: number;
  password: string;
  is_admin: boolean;
}

export interface UserWithOrganization extends User {
  organization?: Organization;
}

export interface LoginDTO {
  name: string;
  password: string;
}
