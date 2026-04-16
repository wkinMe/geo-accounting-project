import { instance } from '@/api/instance';
import type { Material3D } from '@shared/models';
import type { SuccessResponse } from '@shared/types';

export class Material3DService {
	private baseUrl = '/materials3d';

	async findById(id: number): Promise<SuccessResponse<Material3D>> {
		const response = await instance.get<SuccessResponse<Material3D>>(`${this.baseUrl}/${id}`);
		return response.data;
	}

	async findByMaterialId(id: number): Promise<SuccessResponse<Material3D>> {
		const response = await instance.get<SuccessResponse<Material3D>>(
			`${this.baseUrl}/material/${id}`
		);
		return response.data;
	}

	// Принимает FormData, а не объект
	async create(formData: FormData): Promise<Material3D> {
		const response = await instance.post(`${this.baseUrl}`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		return response.data;
	}

	async update(formData: FormData): Promise<Material3D> {
		const response = await instance.patch(`${this.baseUrl}`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		return response.data;
	}

	async delete(materialId: number): Promise<SuccessResponse<void>> {
		const response = await instance.delete<SuccessResponse<void>>(`${this.baseUrl}/${materialId}`);
		return response.data;
	}
}

export const material3dService = new Material3DService();
