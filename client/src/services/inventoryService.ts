// client/src/services/inventoryService.ts
import { instance } from '@/api/instance';
import type { InventoryItem, Material } from '@shared/models';

export interface MaterialRequirement {
	material_id: number;
	required_amount: number;
}

export interface InventoryItemWithMaterial extends InventoryItem {
	material: Material;
}

class InventoryService {
	private readonly baseUrl = '/inventory';

	async getWarehouseStock(warehouseId: number): Promise<InventoryItemWithMaterial[]> {
		const response = await instance.get<{ success: boolean; data: InventoryItemWithMaterial[] }>(
			`${this.baseUrl}/warehouse/${warehouseId}`
		);
		return response.data.data;
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

	async searchMaterials(warehouseId: number, query: string): Promise<InventoryItemWithMaterial[]> {
		const response = await instance.get<{ success: boolean; data: InventoryItemWithMaterial[] }>(
			`${this.baseUrl}/warehouse/${warehouseId}/materials/search`,
			{ params: { q: query } }
		);
		return response.data.data;
	}
}

export const inventoryService = new InventoryService();
