import { instance } from '@/api/instance';
import type {
	AuthResponse,
	CreateUserDTO,
	LoginDTO,
	UpdateUserDTO,
	UserDataDTO,
} from '@shared/dto';
import type { UserWithOrganization } from '@shared/models';

export interface UserListResponse {
	data: UserWithOrganization[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

class UserService {
	private readonly baseUrl = '/users';

	async login(data: LoginDTO): Promise<AuthResponse> {
		localStorage.removeItem('token');

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

	async findAll(
		page: number = 1,
		limit: number = 20,
		sortBy?: string,
		sortOrder?: 'ASC' | 'DESC',
		organization_id?: number
	): Promise<UserListResponse> {
		const params: Record<string, any> = { page, limit };
		if (sortBy) params.sortBy = sortBy;
		if (sortOrder) params.sortOrder = sortOrder;
		if (organization_id) params.organization_id = organization_id;

		const response = await instance.get<{
			success: boolean;
			data: UserWithOrganization[];
			pagination: any;
		}>(`${this.baseUrl}/`, { params });
		return {
			data: response.data.data,
			pagination: response.data.pagination,
		};
	}

	async findById(id: number): Promise<UserWithOrganization> {
		const response = await instance.get<{ success: boolean; data: UserWithOrganization }>(
			`${this.baseUrl}/${id}`
		);
		return response.data.data;
	}

	async update(id: number, data: UpdateUserDTO): Promise<UserWithOrganization> {
		const response = await instance.put<{ success: boolean; data: UserWithOrganization }>(
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

	async search(
		query: string,
		page: number = 1,
		limit: number = 20,
		sortBy?: string,
		sortOrder?: 'ASC' | 'DESC',
		organization_id?: number
	): Promise<UserListResponse> {
		const params: Record<string, any> = { q: query, page, limit };
		if (sortBy) params.sortBy = sortBy;
		if (sortOrder) params.sortOrder = sortOrder;
		if (organization_id) params.organization_id = organization_id;

		const response = await instance.get<{
			success: boolean;
			data: UserWithOrganization[];
			pagination: any;
		}>(`${this.baseUrl}/search`, { params });
		return {
			data: response.data.data,
			pagination: response.data.pagination,
		};
	}

	async getAdmins(organization_id?: number): Promise<UserWithOrganization[]> {
		const params = organization_id ? { organization_id } : {};
		const response = await instance.get<{ success: boolean; data: UserWithOrganization[] }>(
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

	async getSuperAdmins(): Promise<UserWithOrganization[]> {
		const response = await instance.get<{ success: boolean; data: UserWithOrganization[] }>(
			`${this.baseUrl}/super-admins`
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
