// client/src/services/organizationService.ts

import { instance } from '@/api/instance';
import type { CreateOrganizationDTO, UpdateOrganizationDTO } from '@shared/dto';
import type { Organization } from '@shared/models';
import type { SuccessResponse } from '@shared/types';

class OrganizationService {
	private readonly baseUrl = '/organizations';

	/**
	 * Получение всех организаций
	 */
	async findAll(): Promise<SuccessResponse<Organization[]>> {
		const response = await instance.get<SuccessResponse<Organization[]>>(`${this.baseUrl}/`);
		return response.data;
	}

	/**
	 * Получение организации по ID
	 */
	async findById(id: number): Promise<SuccessResponse<Organization>> {
		const response = await instance.get<SuccessResponse<Organization>>(`${this.baseUrl}/${id}`);
		return response.data;
	}

	/**
	 * Создание новой организации
	 */
	async create(data: CreateOrganizationDTO): Promise<SuccessResponse<Organization>> {
		const response = await instance.post<SuccessResponse<Organization>>(`${this.baseUrl}/`, data);
		return response.data;
	}

	/**
	 * Обновление организации
	 */
	async update(id: number, data: UpdateOrganizationDTO): Promise<SuccessResponse<Organization>> {
		const response = await instance.patch<SuccessResponse<Organization>>(
			`${this.baseUrl}/${id}`,
			data
		);
		return response.data;
	}

	/**
	 * Удаление организации
	 */
	async delete(id: number): Promise<SuccessResponse<Organization>> {
		const response = await instance.delete<SuccessResponse<Organization>>(`${this.baseUrl}/${id}`);
		return response.data;
	}

	/**
	 * Поиск организаций по запросу
	 */
	async search(query: string): Promise<SuccessResponse<Organization[]>> {
		const response = await instance.get<SuccessResponse<Organization[]>>(`${this.baseUrl}/search`, {
			params: { q: query },
		});
		return response.data;
	}
}

// Создаем и экспортируем единственный экземпляр
export const organizationService = new OrganizationService();
