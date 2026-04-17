// client/src/services/materialService.ts

import { instance } from '@/api/instance';
import type { CreateMaterialDTO, UpdateMaterialDTO } from '@shared/dto';
import type { Material } from '@shared/models';
import type { SuccessResponse } from '@shared/types';

class MaterialService {
	private readonly baseUrl = '/materials';

	async findAll(): Promise<SuccessResponse<Material[]>> {
		const response = await instance.get<SuccessResponse<Material[]>>(`${this.baseUrl}/`);
		return response.data;
	}

	async findById(id: number): Promise<SuccessResponse<Material>> {
		const response = await instance.get<SuccessResponse<Material>>(`${this.baseUrl}/${id}`);
		return response.data;
	}

	async create(data: CreateMaterialDTO): Promise<SuccessResponse<Material>> {
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
		return response.data;
	}

	async update(id: number, data: UpdateMaterialDTO): Promise<SuccessResponse<Material>> {
		const formData = new FormData();
		if (data.name) formData.append('name', data.name);
		if (data.unit) formData.append('unit', data.unit);
		if (data.image) {
			formData.append('image', data.image);
		} else if (data.image === null) {
			formData.append('remove_image', 'true');
		}

		const response = await instance.patch<SuccessResponse<Material>>(
			`${this.baseUrl}/${id}`,
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			}
		);
		return response.data;
	}

	async delete(id: number): Promise<SuccessResponse<Material>> {
		const response = await instance.delete<SuccessResponse<Material>>(`${this.baseUrl}/${id}`);
		return response.data;
	}

	async search(query: string): Promise<SuccessResponse<Material[]>> {
		const response = await instance.get<SuccessResponse<Material[]>>(`${this.baseUrl}/search`, {
			params: { q: query },
		});
		return response.data;
	}

	async getImageUrl(materialId: number): Promise<string> {
		return `${this.baseUrl}/${materialId}/image`;
	}

	async getImageBlob(materialId: number): Promise<Blob | null> {
		const response = await instance.get(`${this.baseUrl}/${materialId}/image`, {
			responseType: 'blob',
		});

		if (response.status === 404) {
			return null;
		}

		return response.data;
	}

	async upsertImage(materialId: number, imageFile: File): Promise<void> {
		const formData = new FormData();
		formData.append('image', imageFile);

		await instance.put(`${this.baseUrl}/${materialId}/image`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
	}

	async deleteImage(materialId: number): Promise<void> {
		await instance.delete(`${this.baseUrl}/${materialId}/image`);
	}
}

export const materialService = new MaterialService();
