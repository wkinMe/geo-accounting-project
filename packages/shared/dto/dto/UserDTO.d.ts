// packages/shared/dto/user.dto.ts
export interface CreateUserDTO {
  name: string;
  organization_id?: number;
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

export interface UserDataDTO {
  id: number;
  name: string;
  organization_id: number;
  is_admin: boolean;
}

export interface LoginDTO {
  name: string;
  password: string;
}

export interface AuthResponse {
  user: UserDataDTO;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
