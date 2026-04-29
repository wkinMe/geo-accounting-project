// client/src/services/warehouseHistoryService.ts
import { instance } from '@/api/instance';
import type { WarehouseHistoryItemWithDetails } from '@shared/models';

class WarehouseHistoryService {
	private readonly baseUrl = '/warehouse-history';

	async getByWarehouseId(
		warehouseId: number,
		limit?: number,
		offset?: number
	): Promise<WarehouseHistoryItemWithDetails[]> {
		const params: Record<string, any> = {};
		if (limit) params.limit = limit;
		if (offset) params.offset = offset;

		const response = await instance.get<{
			success: boolean;
			data: WarehouseHistoryItemWithDetails[];
		}>(`${this.baseUrl}/warehouse/${warehouseId}`, { params });
		return response.data.data;
	}

	async getByAgreementId(
		agreementId: number,
		limit?: number,
		offset?: number
	): Promise<WarehouseHistoryItemWithDetails[]> {
		const params: Record<string, any> = {};
		if (limit) params.limit = limit;
		if (offset) params.offset = offset;

		const response = await instance.get<{
			success: boolean;
			data: WarehouseHistoryItemWithDetails[];
		}>(`${this.baseUrl}/agreement/${agreementId}`, { params });
		return response.data.data;
	}

	async getByMaterialId(
		materialId: number,
		limit?: number,
		offset?: number
	): Promise<WarehouseHistoryItemWithDetails[]> {
		const params: Record<string, any> = {};
		if (limit) params.limit = limit;
		if (offset) params.offset = offset;

		const response = await instance.get<{
			success: boolean;
			data: WarehouseHistoryItemWithDetails[];
		}>(`${this.baseUrl}/material/${materialId}`, { params });
		return response.data.data;
	}
}

export const warehouseHistoryService = new WarehouseHistoryService();
