// shared/dto/UserDTO.ts
import { UserRole } from "../models";

export interface CreateUserDTO {
  name: string;
  organization_id: number;
  password: string;
  role?: UserRole; // Опционально, по умолчанию 'user'
}

export interface UpdateUserDTO {
  id: number;
  name?: string;
  organization_id?: number;
  password?: string;
  role?: UserRole;
}

export interface UserDataDTO {
  id: number;
  name: string;
  organization_id: number;
  role: UserRole;
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
