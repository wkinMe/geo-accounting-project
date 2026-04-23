// client/src/services/organizationService.ts
import { instance } from '@/api/instance';
import type { CreateOrganizationDTO, UpdateOrganizationDTO } from '@shared/dto';
import type { Organization } from '@shared/models';

class OrganizationService {
	private readonly baseUrl = '/organizations';

	async findAll(): Promise<Organization[]> {
		const response = await instance.get<{ success: boolean; data: Organization[] }>(
			`${this.baseUrl}/`
		);
		return response.data.data;
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

	async search(query: string): Promise<Organization[]> {
		const response = await instance.get<{ success: boolean; data: Organization[] }>(
			`${this.baseUrl}/search`,
			{
				params: { q: query },
			}
		);
		return response.data.data;
	}
}

export const organizationService = new OrganizationService();
