// client/src/services/warehouseService.ts
import { instance } from '@/api/instance';
import type { CreateWarehouseDTO, UpdateWarehouseDTO } from '@shared/dto';
import type { WarehouseWithManagerAndOrganization } from '@shared/models';

class WarehouseService {
	private readonly baseUrl = '/warehouses';

	async findAll(organization_id?: number): Promise<WarehouseWithManagerAndOrganization[]> {
		const params = organization_id ? { organization_id } : {};
		const response = await instance.get<{
			success: boolean;
			data: WarehouseWithManagerAndOrganization[];
		}>(`${this.baseUrl}/`, { params });
		return response.data.data;
	}

	async findById(id: number): Promise<WarehouseWithManagerAndOrganization> {
		const response = await instance.get<{
			success: boolean;
			data: WarehouseWithManagerAndOrganization;
		}>(`${this.baseUrl}/${id}`);
		return response.data.data;
	}

	async create(data: CreateWarehouseDTO): Promise<WarehouseWithManagerAndOrganization> {
		const response = await instance.post<{
			success: boolean;
			data: WarehouseWithManagerAndOrganization;
		}>(`${this.baseUrl}/`, data);
		return response.data.data;
	}

	async update(id: number, data: UpdateWarehouseDTO): Promise<WarehouseWithManagerAndOrganization> {
		const response = await instance.put<{
			success: boolean;
			data: WarehouseWithManagerAndOrganization;
		}>(`${this.baseUrl}/${id}`, data);
		return response.data.data;
	}

	async delete(id: number): Promise<void> {
		const response = await instance.delete<{ success: boolean; message: string }>(
			`${this.baseUrl}/${id}`
		);
		if (!response.data.success) {
			throw new Error(response.data.message || 'Не удалось удалить склад');
		}
	}

	async findByManagerId(managerId: number): Promise<WarehouseWithManagerAndOrganization[]> {
		const response = await instance.get<{
			success: boolean;
			data: WarehouseWithManagerAndOrganization[];
		}>(`${this.baseUrl}/manager/${managerId}`);
		return response.data.data;
	}

	async assignManager(
		warehouseId: number,
		manager_id: number | null
	): Promise<WarehouseWithManagerAndOrganization> {
		const response = await instance.patch<{
			success: boolean;
			data: WarehouseWithManagerAndOrganization;
		}>(`${this.baseUrl}/${warehouseId}/assign-manager`, { manager_id });
		return response.data.data;
	}

	async search(
		query: string,
		organization_id?: number
	): Promise<WarehouseWithManagerAndOrganization[]> {
		const params: Record<string, any> = { q: query };
		if (organization_id) {
			params.organization_id = organization_id;
		}
		const response = await instance.get<{
			success: boolean;
			data: WarehouseWithManagerAndOrganization[];
		}>(`${this.baseUrl}/search`, { params });
		return response.data.data;
	}
}

export const warehouseService = new WarehouseService();
