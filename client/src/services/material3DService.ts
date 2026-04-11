import { instance } from '@/api/instance';
import type { CreateMaterial3DObjectDTO, UpdateAgreementDTO } from '@shared/dto';
import type { Material3D } from '@shared/models';

export class Material3DService {
	private baseUrl = '/materials3d';

	async findById(id: number): Promise<Material3D> {
		const response = await instance.get<Material3D>(`${this.baseUrl}/${id}`);
		return response.data;
	}

	async findByMaterialId(id: number): Promise<Material3D> {
	
		const response = await instance.get<Material3D>(`${this.baseUrl}/material/${id}`);
		return response.data;
	}

	async create(data: CreateMaterial3DObjectDTO) {
		const response = await instance.post(`${this.baseUrl}`, data);

		return response.data;
	}

	async update(data: UpdateAgreementDTO) {
		const response = await instance.patch(`${this.baseUrl}`, data);

		return response.data;
	}
}

export const material3dService = new Material3DService();
