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

class UserService {
	private readonly baseUrl = '/users';

	async login(data: LoginDTO): Promise<AuthResponse> {
		const response = await instance.post<{ success: boolean; data: AuthResponse }>(
			`${this.baseUrl}/login`,
			data
		);

		if (response.data.data.accessToken) {
			localStorage.setItem('token', response.data.data.accessToken);
		}

		return response.data.data;
	}

	async register(data: CreateUserDTO): Promise<AuthResponse> {
		const response = await instance.post<{ success: boolean; data: AuthResponse }>(
			`${this.baseUrl}/register`,
			data
		);

		if (response.data.data.accessToken) {
			localStorage.setItem('token', response.data.data.accessToken);
		}

		return response.data.data;
	}

	async logout(): Promise<void> {
		try {
			await instance.post(`${this.baseUrl}/logout`, {});
			localStorage.removeItem('token');
		} catch (e) {
			localStorage.removeItem('token');
			throw e;
		}
	}

	async refreshToken(): Promise<AuthResponse> {
		const response = await instance.post<{ success: boolean; data: AuthResponse }>(
			`${this.baseUrl}/refresh`,
			{}
		);

		if (response.data.data.accessToken) {
			localStorage.setItem('token', response.data.data.accessToken);
		}

		return response.data.data;
	}

	async getProfile(): Promise<UserDataDTO> {
		const response = await instance.get<{ success: boolean; data: UserDataDTO }>(
			`${this.baseUrl}/profile`
		);
		return response.data.data;
	}

	async findAll(): Promise<User[]> {
		const response = await instance.get<{ success: boolean; data: User[] }>(`${this.baseUrl}/`);
		return response.data.data;
	}

	async findById(id: number): Promise<User> {
		const response = await instance.get<{ success: boolean; data: User }>(`${this.baseUrl}/${id}`);
		return response.data.data;
	}

	async update(id: number, data: UpdateUserDTO): Promise<User> {
		const response = await instance.put<{ success: boolean; data: User }>(
			`${this.baseUrl}/${id}`,
			data
		);
		return response.data.data;
	}

	async delete(id: number): Promise<void> {
		const response = await instance.delete<{ success: boolean; message: string }>(
			`${this.baseUrl}/${id}`
		);
		if (!response.data.success) {
			throw new Error(response.data.message || 'Не удалось удалить пользователя');
		}
	}

	async search(query: string, organization_id?: number): Promise<User[]> {
		const response = await instance.get<{ success: boolean; data: User[] }>(
			`${this.baseUrl}/search`,
			{
				params: { q: query, organization_id },
			}
		);
		return response.data.data;
	}

	async getAdmins(organization_id?: number): Promise<User[]> {
		const params = organization_id ? { organization_id } : {};
		const response = await instance.get<{ success: boolean; data: User[] }>(
			`${this.baseUrl}/admins`,
			{ params }
		);
		return response.data.data;
	}

	async findByOrganizationId(organizationId: number): Promise<UserWithOrganization[]> {
		const response = await instance.get<{ success: boolean; data: UserWithOrganization[] }>(
			`${this.baseUrl}/organization/${organizationId}`
		);
		return response.data.data;
	}

	async getAvailableManagers(organization_id?: number): Promise<User[]> {
		const params = organization_id ? { organization_id } : {};
		const response = await instance.get<{ success: boolean; data: User[] }>(
			`${this.baseUrl}/available-managers`,
			{ params }
		);
		return response.data.data;
	}

	async getSuperAdmins(): Promise<UserWithOrganization[]> {
		const response = await instance.get<{ success: boolean; data: UserWithOrganization[] }>(
			`${this.baseUrl}/super-admins`
		);
		return response.data.data;
	}

	async searchAvailableManagers(
		query: string,
		organization_id?: number
	): Promise<UserWithOrganization[]> {
		const response = await instance.get<{ success: boolean; data: UserWithOrganization[] }>(
			`${this.baseUrl}/available-managers/search`,
			{
				params: { q: query, organization_id },
			}
		);
		return response.data.data;
	}

	isAuthenticated(): boolean {
		return !!localStorage.getItem('token');
	}

	getToken(): string | null {
		return localStorage.getItem('token');
	}
}

export const userService = new UserService();
