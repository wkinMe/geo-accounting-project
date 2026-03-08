// client/src/services/userService.ts

import { instance } from '@/api/instance';
import type {
	AuthResponse,
	CreateUserDTO,
	LoginDTO,
	UpdateUserDTO,
	UserDataDTO,
} from '@shared/dto';
import type { User, UserWithOrganization } from '@shared/models';
import type { SuccessResponse } from '@shared/types';

class UserService {
	private readonly baseUrl = '/users';

	/**
	 * Аутентификация
	 */
	async login(data: LoginDTO): Promise<SuccessResponse<AuthResponse>> {
		const response = await instance.post<SuccessResponse<AuthResponse>>(`${this.baseUrl}/login/`, data);

		if (response.data?.data?.tokens?.accessToken) {
			localStorage.setItem('token', response.data.data.tokens.accessToken);
		}

		return response.data;
	}

	async register(data: CreateUserDTO): Promise<SuccessResponse<AuthResponse>> {
		const response = await instance.post<SuccessResponse<AuthResponse>>(
			`${this.baseUrl}/register`,
			data
		);

		if (response.data?.data?.tokens?.accessToken) {
			localStorage.setItem('token', response.data.data.tokens.accessToken);
		}

		return response.data;
	}

	async logout(): Promise<SuccessResponse<null> | undefined> {
		try {
			const response = await instance.post<SuccessResponse<null>>(`${this.baseUrl}/logout`, {});
			localStorage.removeItem('token');
			return response.data;
		} catch (e: unknown) {
			if (e instanceof Error) {
				throw new Error('Logout error' + e.message);
			}
		}
	}

	async refreshToken(): Promise<SuccessResponse<AuthResponse>> {
		const response = await instance.post<SuccessResponse<AuthResponse>>(`${this.baseUrl}/refresh`, {});

		if (response.data?.data?.tokens?.accessToken) {
			localStorage.setItem('token', response.data.data.tokens.accessToken);
		}

		return response.data;
	}

	async getProfile(): Promise<SuccessResponse<UserDataDTO>> {
		const response = await instance.get<SuccessResponse<UserDataDTO>>(`${this.baseUrl}/profile`);
		return response.data;
	}

	/**
	 * CRUD операции
	 */
	async findAll(): Promise<SuccessResponse<User[]>> {
		const response = await instance.get<SuccessResponse<User[]>>(`${this.baseUrl}/`);
		return response.data;
	}

	async findById(id: number): Promise<SuccessResponse<User>> {
		const response = await instance.get<SuccessResponse<User>>(`${this.baseUrl}/${id}`);
		return response.data;
	}

	async update(id: number, data: Omit<UpdateUserDTO, 'id'>): Promise<SuccessResponse<User>> {
		const response = await instance.patch<SuccessResponse<User>>(`${this.baseUrl}/${id}`, data);
		return response.data;
	}

	async delete(id: number): Promise<SuccessResponse<User>> {
		const response = await instance.delete<SuccessResponse<User>>(`${this.baseUrl}/${id}`);
		return response.data;
	}

	/**
	 * Поиск и фильтрация
	 */
	async search(query: string, organization_id?: number): Promise<SuccessResponse<User[]>> {
		const response = await instance.get<SuccessResponse<User[]>>(`${this.baseUrl}/search`, {
			params: { q: query, organization_id },
		});
		return response.data;
	}

	async getAdmins(): Promise<SuccessResponse<User[]>> {
		const response = await instance.get<SuccessResponse<User[]>>(`${this.baseUrl}/admins`);
		return response.data;
	}

	async findByOrganizationId(organizationId: number): Promise<SuccessResponse<UserWithOrganization[]>> {
		const response = await instance.get<SuccessResponse<UserWithOrganization[]>>(
			`${this.baseUrl}/organization/${organizationId}`
		);
		return response.data;
	}

	async getAvailableManagers(): Promise<SuccessResponse<User[]>> {
		const response = await instance.get<SuccessResponse<User[]>>(`${this.baseUrl}/available-managers`);
		return response.data;
	}

	/**
	 * Утилиты
	 */
	isAuthenticated(): boolean {
		return !!localStorage.getItem('token');
	}

	getToken(): string | null {
		return localStorage.getItem('token');
	}
}

// Создаем и экспортируем единственный экземпляр
export const userService = new UserService();
