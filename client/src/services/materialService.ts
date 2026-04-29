// client/src/services/materialService.ts
import { instance } from '@/api/instance';
import type { CreateMaterialDTO, UpdateMaterialDTO } from '@shared/dto';
import type { Material } from '@shared/models';

export interface MaterialsListResponse {
	data: Material[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

class MaterialService {
	private readonly baseUrl = '/materials';

	async findAll(
		page: number = 1,
		limit: number = 20,
		sortBy?: string,
		sortOrder?: 'ASC' | 'DESC'
	): Promise<MaterialsListResponse> {
		const params: Record<string, any> = { page, limit };
		if (sortBy) params.sortBy = sortBy;
		if (sortOrder) params.sortOrder = sortOrder;

		const response = await instance.get<{ success: boolean; data: Material[]; pagination: any }>(
			`${this.baseUrl}/`,
			{ params }
		);
		return {
			data: response.data.data,
			pagination: response.data.pagination,
		};
	}

	async findById(id: number): Promise<Material> {
		const response = await instance.get<{ success: boolean; data: Material }>(
			`${this.baseUrl}/${id}`
		);
		return response.data.data;
	}

	async create(data: CreateMaterialDTO): Promise<Material> {
		const formData = new FormData();
		formData.append('name', data.name);
		formData.append('unit', data.unit);
		if (data.image) {
			formData.append('image', data.image);
		}

		const response = await instance.post<{ success: boolean; data: Material }>(
			`${this.baseUrl}/`,
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			}
		);
		return response.data.data;
	}

	async update(id: number, data: UpdateMaterialDTO): Promise<Material> {
		const formData = new FormData();
		if (data.name) formData.append('name', data.name);
		if (data.unit) formData.append('unit', data.unit);

		if (data.image !== undefined) {
			if (data.image === null) {
				formData.append('image', 'null');
			} else if (data.image instanceof File) {
				formData.append('image', data.image);
			}
		}

		const response = await instance.put<{ success: boolean; data: Material }>(
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
		const response = await instance.delete<{ success: boolean; message: string }>(
			`${this.baseUrl}/${id}`
		);
		if (!response.data.success) {
			throw new Error(response.data.message || 'Не удалось удалить материал');
		}
	}

	async search(
		query: string,
		page: number = 1,
		limit: number = 20,
		sortBy?: string,
		sortOrder?: 'ASC' | 'DESC'
	): Promise<MaterialsListResponse> {
		const params: Record<string, any> = { q: query, page, limit };
		if (sortBy) params.sortBy = sortBy;
		if (sortOrder) params.sortOrder = sortOrder;

		const response = await instance.get<{ success: boolean; data: Material[]; pagination: any }>(
			`${this.baseUrl}/search`,
			{ params }
		);
		return {
			data: response.data.data,
			pagination: response.data.pagination,
		};
	}

	async getImageUrl(materialId: number): Promise<string> {
		return `${instance.defaults.baseURL}${this.baseUrl}/${materialId}/image`;
	}

	async getImageBlob(materialId: number): Promise<Blob | null> {
		try {
			const response = await instance.get(`${this.baseUrl}/${materialId}/image`, {
				responseType: 'blob',
			});
			return response.data;
		} catch (error: any) {
			if (error.response?.status === 404) {
				return null;
			}
			throw error;
		}
	}

	async uploadImage(materialId: number, imageFile: File): Promise<void> {
		const formData = new FormData();
		formData.append('image', imageFile);
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
			const blob = await this.getImageBlob(materialId);
			return blob !== null;
		} catch {
			return false;
		}
	}
}

export const materialService = new MaterialService();
