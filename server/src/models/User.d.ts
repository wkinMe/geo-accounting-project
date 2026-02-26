import { BaseModel } from "./Base";
import { Organization } from "./Organization";

export interface User extends BaseModel {
  name: string;
  organization_id: number;
  password: string;
  is_admin: boolean;
}

export interface UserWithOrganization extends User {
  organization?: Organization;
}
