import { instance } from '@/api/instance';
import type { WarehouseHistoryItemWithDetails } from '@shared/models';

export interface WarehouseHistoryResponse {
	data: WarehouseHistoryItemWithDetails[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

class WarehouseHistoryService {
	private readonly baseUrl = '/warehouse-history';

	async getByWarehouseId(
		warehouseId: number,
		page: number = 1,
		limit: number = 20,
		sortBy?: string,
		sortOrder?: 'ASC' | 'DESC'
	): Promise<WarehouseHistoryResponse> {
		const params: Record<string, any> = { page, limit };
		if (sortBy) params.sortBy = sortBy;
		if (sortOrder) params.sortOrder = sortOrder;

		const response = await instance.get<{
			success: boolean;
			data: WarehouseHistoryItemWithDetails[];
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

	async search(
		warehouseId: number,
		query: string,
		page: number = 1,
		limit: number = 20,
		sortBy?: string,
		sortOrder?: 'ASC' | 'DESC'
	): Promise<WarehouseHistoryResponse> {
		const params: Record<string, any> = { q: query, page, limit };
		if (sortBy) params.sortBy = sortBy;
		if (sortOrder) params.sortOrder = sortOrder;

		const response = await instance.get<{
			success: boolean;
			data: WarehouseHistoryItemWithDetails[];
			pagination: {
				page: number;
				limit: number;
				total: number;
				totalPages: number;
			};
		}>(`${this.baseUrl}/warehouse/${warehouseId}/search`, { params });

		return {
			data: response.data.data,
			pagination: response.data.pagination,
		};
	}
}

export const warehouseHistoryService = new WarehouseHistoryService();
