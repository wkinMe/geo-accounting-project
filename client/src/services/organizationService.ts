// client/src/services/organizationService.ts
import { instance } from '@/api/instance';
import type { CreateOrganizationDTO, UpdateOrganizationDTO } from '@shared/dto';
import type { Organization } from '@shared/models';

export interface OrganizationListResponse {
	data: Organization[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

class OrganizationService {
	private readonly baseUrl = '/organizations';

	async findAll(
		page: number = 1,
		limit: number = 20,
		sortBy?: string,
		sortOrder?: 'ASC' | 'DESC'
	): Promise<OrganizationListResponse> {
		const params: Record<string, any> = { page, limit };
		if (sortBy) params.sortBy = sortBy;
		if (sortOrder) params.sortOrder = sortOrder;

		const response = await instance.get<{
			success: boolean;
			data: Organization[];
			pagination: any;
		}>(`${this.baseUrl}/`, { params });
		return {
			data: response.data.data,
			pagination: response.data.pagination,
		};
	}

	async findById(id: number): Promise<Organization> {
		const response = await instance.get<{ success: boolean; data: Organization }>(
			`${this.baseUrl}/${id}`
		);
		return response.data.data;
	}

	async create(data: CreateOrganizationDTO): Promise<Organization> {
		const response = await instance.post<{ success: boolean; data: Organization }>(
			`${this.baseUrl}/`,
			data
		);
		return response.data.data;
	}

	async update(id: number, data: UpdateOrganizationDTO): Promise<Organization> {
		const response = await instance.put<{ success: boolean; data: Organization }>(
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
			throw new Error(response.data.message || 'Не удалось удалить организацию');
		}
	}

	async search(
		query: string,
		page: number = 1,
		limit: number = 20,
		sortBy?: string,
		sortOrder?: 'ASC' | 'DESC'
	): Promise<OrganizationListResponse> {
		const params: Record<string, any> = { q: query, page, limit };
		if (sortBy) params.sortBy = sortBy;
		if (sortOrder) params.sortOrder = sortOrder;

		const response = await instance.get<{
			success: boolean;
			data: Organization[];
			pagination: any;
		}>(`${this.baseUrl}/search`, { params });
		return {
			data: response.data.data,
			pagination: response.data.pagination,
		};
	}
}

export const organizationService = new OrganizationService();
