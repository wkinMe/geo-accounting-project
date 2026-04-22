// client/src/services/materialService.ts

import { instance } from '@/api/instance';
import type { CreateMaterialDTO, UpdateMaterialDTO } from '@shared/dto';
import type { Material } from '@shared/models';
import type { SuccessResponse } from '@shared/types';

class MaterialService {
	private readonly baseUrl = '/materials';

	async findAll(): Promise<Material[]> {
		const response = await instance.get<SuccessResponse<Material[]>>(`${this.baseUrl}/`);
		// Возвращаем data.data, так как ответ обернут в { success, data }
		return response.data.data;
	}

	async findById(id: number): Promise<Material> {
		const response = await instance.get<SuccessResponse<Material>>(`${this.baseUrl}/${id}`);
		return response.data.data;
	}

	async create(data: CreateMaterialDTO): Promise<Material> {
		const formData = new FormData();
		formData.append('name', data.name);
		formData.append('unit', data.unit);
		if (data.image) {
			formData.append('image', data.image);
		}

		const response = await instance.post<SuccessResponse<Material>>(`${this.baseUrl}/`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		return response.data.data;
	}

	async update(id: number, data: UpdateMaterialDTO): Promise<Material> {
		const formData = new FormData();
		if (data.name) formData.append('name', data.name);
		if (data.unit) formData.append('unit', data.unit);

		// Обработка изображения согласно новому API
		if (data.image !== undefined) {
			if (data.image === null) {
				// Отправляем null, чтобы удалить изображение
				formData.append('image', 'null');
			} else if (data.image instanceof File) {
				formData.append('image', data.image);
			}
		}

		// Используем PUT вместо PATCH (согласно новым роутам)
		const response = await instance.put<SuccessResponse<Material>>(
			`${this.baseUrl}/${id}`,
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			}
		);
		return response.data.data;
	}

	async delete(id: number): Promise<void> {
		const response = await instance.delete<SuccessResponse<{ message: string }>>(
			`${this.baseUrl}/${id}`
		);
		// Не возвращаем данные, только успешный статус
		if (!response.data.success) {
			throw new Error('Failed to delete material');
		}
	}

	async search(query: string): Promise<Material[]> {
		const response = await instance.get<SuccessResponse<Material[]>>(`${this.baseUrl}/search`, {
			params: { q: query },
		});
		return response.data.data;
	}

	// Image endpoints
	async getImageUrl(materialId: number): Promise<string> {
		// Возвращаем полный URL для изображения
		return `${instance.defaults.baseURL}${this.baseUrl}/${materialId}/image`;
	}

	async getImageBlob(materialId: number): Promise<Blob | null> {
		try {
			const response = await instance.get(`${this.baseUrl}/${materialId}/image`, {
				responseType: 'blob',
			});

			// Если изображение не найдено, возвращаем null
			if (response.status === 404) {
				return null;
			}

			return response.data;
		} catch (error: any) {
			// Если ошибка 404, возвращаем null
			if (error.response?.status === 404) {
				return null;
			}
			throw error;
		}
	}

	async uploadImage(materialId: number, imageFile: File): Promise<void> {
		const formData = new FormData();
		formData.append('image', imageFile);

		// Используем POST согласно новым роутам
		await instance.post(`${this.baseUrl}/${materialId}/image`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
	}

	async deleteImage(materialId: number): Promise<void> {
		await instance.delete(`${this.baseUrl}/${materialId}/image`);
	}

	async imageExists(materialId: number): Promise<boolean> {
		try {
			// Пытаемся получить изображение
			const blob = await this.getImageBlob(materialId);
			return blob !== null;
		} catch {
			return false;
		}
	}
}

export const materialService = new MaterialService();
