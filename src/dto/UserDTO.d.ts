export interface CreateUserDTO {
  name: string;
  organization_id: string;
  password: string;
  is_admin: boolean;
}

export interface UpdateUserDTO {
  id: number;
  name?: string;
  organization_id?: string;
  password?: string;
  is_admin?: boolean;
}
