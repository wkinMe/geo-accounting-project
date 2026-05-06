import { instance } from '@/api/instance';
import type { InventoryItem, Material } from '@shared/models';

export interface MaterialRequirement {
	material_id: number;
	required_amount: number;
}

export interface InventoryItemWithMaterial extends InventoryItem {
	material: Material;
}

export interface InventoryResponse {
	data: InventoryItemWithMaterial[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

class InventoryService {
	private readonly baseUrl = '/inventory';

	async getWarehouseStock(
		warehouseId: number,
		page: number = 1,
		limit: number = 20,
		sortBy?: string,
		sortOrder?: 'ASC' | 'DESC'
	): Promise<InventoryResponse> {
		const params: Record<string, any> = { page, limit };
		if (sortBy) params.sortBy = sortBy;
		if (sortOrder) params.sortOrder = sortOrder;

		const response = await instance.get<{
			success: boolean;
			data: InventoryItemWithMaterial[];
			pagination: {
				page: number;
				limit: number;
				total: number;
				totalPages: number;
			};
		}>(`${this.baseUrl}/warehouse/${warehouseId}`, { params });

		return {
			data: response.data.data,
			pagination: response.data.pagination,
		};
	}

	async getMaterialDistribution(materialId: number): Promise<{
		total_amount: number;
		warehouses_count: number;
		items: Array<{
			warehouse_id: number;
			warehouse_name: string;
			amount: number;
			percentage: number;
		}>;
	}> {
		const response = await instance.get<{ success: boolean; data: any }>(
			`${this.baseUrl}/material/${materialId}/distribution`
		);
		return response.data.data;
	}

	async findWarehouseWithMaxMaterial(
		materialId: number
	): Promise<{ warehouse_id: number; amount: number } | null> {
		const response = await instance.get<{
			success: boolean;
			data: { warehouse_id: number; amount: number } | null;
		}>(`${this.baseUrl}/material/${materialId}/max-warehouse`);
		return response.data.data;
	}

	async findTopWarehousesByMaterial(
		materialId: number,
		limit: number = 5
	): Promise<{ warehouse_id: number; amount: number }[]> {
		const response = await instance.get<{
			success: boolean;
			data: { warehouse_id: number; amount: number }[];
		}>(`${this.baseUrl}/material/${materialId}/top-warehouses`, { params: { limit } });
		return response.data.data;
	}

	async addMaterial(
		warehouseId: number,
		material_id: number,
		amount: number
	): Promise<InventoryItemWithMaterial> {
		const response = await instance.post<{ success: boolean; data: InventoryItemWithMaterial }>(
			`${this.baseUrl}/warehouse/${warehouseId}/materials`,
			{ material_id, amount }
		);
		return response.data.data;
	}

	async setAmount(
		warehouseId: number,
		materialId: number,
		amount: number
	): Promise<InventoryItemWithMaterial | null> {
		const response = await instance.put<{
			success: boolean;
			data: InventoryItemWithMaterial | null;
		}>(`${this.baseUrl}/warehouse/${warehouseId}/materials/${materialId}`, { amount });
		return response.data.data;
	}

	async removeMaterial(
		warehouseId: number,
		materialId: number,
		amount: number
	): Promise<InventoryItemWithMaterial> {
		const response = await instance.delete<{ success: boolean; data: InventoryItemWithMaterial }>(
			`${this.baseUrl}/warehouse/${warehouseId}/materials/${materialId}`,
			{ data: { amount } }
		);
		return response.data.data;
	}

	async checkAvailability(
		warehouseId: number,
		requirements: MaterialRequirement[]
	): Promise<boolean> {
		const response = await instance.post<{ success: boolean; data: { is_available: boolean } }>(
			`${this.baseUrl}/warehouse/${warehouseId}/check-availability`,
			{ requirements }
		);
		return response.data.data.is_available;
	}

	async searchMaterialsPaginated(
		warehouseId: number,
		query: string,
		page: number = 1,
		limit: number = 20,
		sortBy?: string,
		sortOrder?: 'ASC' | 'DESC'
	): Promise<InventoryResponse> {
		const params: Record<string, any> = { q: query, page, limit };
		if (sortBy) params.sortBy = sortBy;
		if (sortOrder) params.sortOrder = sortOrder;

		const response = await instance.get<{
			success: boolean;
			data: InventoryItemWithMaterial[];
			pagination: {
				page: number;
				limit: number;
				total: number;
				totalPages: number;
			};
		}>(`${this.baseUrl}/warehouse/${warehouseId}/materials/search`, { params });

		return {
			data: response.data.data,
			pagination: response.data.pagination,
		};
	}
}

export const inventoryService = new InventoryService();
