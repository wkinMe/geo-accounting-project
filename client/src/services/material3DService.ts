// client/src/services/material3DService.ts
import { instance } from '@/api/instance';

export interface Material3DResponse {
	id: number;
	materialId: number;
	format: string;
	createdAt: string;
	updatedAt: string;
}

class Material3DService {
	private baseUrl = '/materials3d';

	async findByMaterialId(materialId: number): Promise<Material3DResponse | null> {
		const response = await instance.get<{ success: boolean; data: Material3DResponse | null }>(
			`${this.baseUrl}/material/${materialId}`
		);
		return response.data.data;
	}

	async downloadModel(materialId: number): Promise<Blob> {
		const response = await instance.get(`${this.baseUrl}/material/${materialId}/download`, {
			responseType: 'blob',
		});
		return response.data;
	}

	// ВАЖНО: поле 'model', а не 'model_data' как было раньше
	async create(materialId: number, format: string, file: File): Promise<Material3DResponse> {
		const formData = new FormData();
		formData.append('materialId', materialId.toString());
		formData.append('format', format);
		formData.append('model', file); // ← ключевое изменение

		const response = await instance.post<{ success: boolean; data: Material3DResponse }>(
			`${this.baseUrl}/`,
			formData,
			{
				headers: { 'Content-Type': 'multipart/form-data' },
			}
		);
		return response.data.data;
	}

	// ВАЖНО: поле 'model', а не 'model_data' как было раньше
	async update(materialId: number, format?: string, file?: File): Promise<Material3DResponse> {
		const formData = new FormData();
		if (format) formData.append('format', format);
		if (file) formData.append('model', file); // ← ключевое изменение

		const response = await instance.put<{ success: boolean; data: Material3DResponse }>(
			`${this.baseUrl}/material/${materialId}`,
			formData,
			{
				headers: { 'Content-Type': 'multipart/form-data' },
			}
		);
		return response.data.data;
	}

	async delete(materialId: number): Promise<void> {
		await instance.delete(`${this.baseUrl}/material/${materialId}`);
	}

	getDownloadUrl(materialId: number): string {
		return `${instance.defaults.baseURL}${this.baseUrl}/material/${materialId}/download`;
	}
}

export const material3dService = new Material3DService();
