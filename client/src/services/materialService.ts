// client/src/services/materialService.ts

import { instance } from '@/api/instance';
import type { CreateMaterialDTO, UpdateMaterialDTO } from '@shared/dto';
import type { Material } from '@shared/models';
import type { SuccessResponse } from '@shared/types';

class MaterialService {
	private readonly baseUrl = '/materials';

	/**
	 * Получение всех материалов
	 */
	async findAll(): Promise<SuccessResponse<Material[]>> {
		const response = await instance.get<SuccessResponse<Material[]>>(`${this.baseUrl}/`);
		return response.data;
	}

	/**
	 * Получение материала по ID
	 */
	async findById(id: number): Promise<SuccessResponse<Material>> {
		const response = await instance.get<SuccessResponse<Material>>(`${this.baseUrl}/${id}`);
		return response.data;
	}

	/**
	 * Создание нового материала
	 */
	async create(data: CreateMaterialDTO): Promise<SuccessResponse<Material>> {
		const response = await instance.post<SuccessResponse<Material>>(`${this.baseUrl}/`, data);
		return response.data;
	}

	/**
	 * Обновление материала
	 */
	async update(id: number, data: UpdateMaterialDTO): Promise<SuccessResponse<Material>> {
		const response = await instance.patch<SuccessResponse<Material>>(`${this.baseUrl}/${id}`, data);
		return response.data;
	}

	/**
	 * Удаление материала
	 */
	async delete(id: number): Promise<SuccessResponse<Material>> {
		const response = await instance.delete<SuccessResponse<Material>>(`${this.baseUrl}/${id}`);
		return response.data;
	}

	/**
	 * Поиск материалов по запросу
	 */
	async search(query: string): Promise<SuccessResponse<Material[]>> {
		const response = await instance.get<SuccessResponse<Material[]>>(`${this.baseUrl}/search`, {
			params: { q: query },
		});
		return response.data;
	}
}

// Создаем и экспортируем единственный экземпляр
export const materialService = new MaterialService();
