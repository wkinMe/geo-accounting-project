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

// Интерфейс для ответа API (как в контроллере)
export interface ApiResponse<T> {
	data: T;
	message: string;
}

class UserService {
	private readonly baseUrl = '/users';

	/**
	 * Аутентификация
	 */
	async login(data: LoginDTO): Promise<ApiResponse<AuthResponse>> {
		const response = await instance.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login/`, data);

		if (response.data?.data?.tokens?.accessToken) {
			localStorage.setItem('token', response.data.data.tokens.accessToken);
		}

		return response.data;
	}

	async register(data: CreateUserDTO): Promise<ApiResponse<AuthResponse>> {
		const response = await instance.post<ApiResponse<AuthResponse>>(
			`${this.baseUrl}/register`,
			data
		);

		if (response.data?.data?.tokens?.accessToken) {
			localStorage.setItem('token', response.data.data.tokens.accessToken);
		}

		return response.data;
	}

	async logout(): Promise<ApiResponse<null>> {
		try {
			const response = await instance.post<ApiResponse<null>>(`${this.baseUrl}/logout`, {});
			return response.data;
		} finally {
			localStorage.removeItem('token');
		}
	}

	async refreshToken(): Promise<ApiResponse<AuthResponse>> {
		const response = await instance.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/refresh`, {});

		if (response.data?.data?.tokens?.accessToken) {
			localStorage.setItem('token', response.data.data.tokens.accessToken);
		}

		return response.data;
	}

	async getProfile(): Promise<ApiResponse<UserDataDTO>> {
		const response = await instance.get<ApiResponse<UserDataDTO>>(`${this.baseUrl}/profile`);
		return response.data;
	}

	/**
	 * CRUD операции
	 */
	async findAll(): Promise<ApiResponse<User[]>> {
		const response = await instance.get<ApiResponse<User[]>>(`${this.baseUrl}/`);
		return response.data;
	}

	async findById(id: number): Promise<ApiResponse<User>> {
		const response = await instance.get<ApiResponse<User>>(`${this.baseUrl}/${id}`);
		return response.data;
	}

	async update(id: number, data: Omit<UpdateUserDTO, 'id'>): Promise<ApiResponse<User>> {
		const response = await instance.patch<ApiResponse<User>>(`${this.baseUrl}/${id}`, data);
		return response.data;
	}

	async delete(id: number): Promise<ApiResponse<User>> {
		const response = await instance.delete<ApiResponse<User>>(`${this.baseUrl}/${id}`);
		return response.data;
	}

	/**
	 * Поиск и фильтрация
	 */
	async search(query: string): Promise<ApiResponse<User[]>> {
		const response = await instance.get<ApiResponse<User[]>>(`${this.baseUrl}/search`, {
			params: { q: query },
		});
		return response.data;
	}

	async getAdmins(): Promise<ApiResponse<User[]>> {
		const response = await instance.get<ApiResponse<User[]>>(`${this.baseUrl}/admins`);
		return response.data;
	}

	async findByOrganizationId(organizationId: number): Promise<ApiResponse<UserWithOrganization[]>> {
		const response = await instance.get<ApiResponse<UserWithOrganization[]>>(
			`${this.baseUrl}/organization/${organizationId}`
		);
		return response.data;
	}

	async getAvailableManagers(): Promise<ApiResponse<User[]>> {
		const response = await instance.get<ApiResponse<User[]>>(`${this.baseUrl}/available-managers`);
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
