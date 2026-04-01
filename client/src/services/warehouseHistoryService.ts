// client/src/services/warehouseHistoryService.ts
import { instance } from '@/api/instance';
import type { SuccessResponse } from '@shared/types';
import type { WarehouseHistoryWithDetails } from '@shared/models';

class WarehouseHistoryService {
	private readonly baseUrl = '/warehouse-history';

	/**
	 * Получение истории изменений материалов на складе
	 */
	async getByWarehouseId(
		warehouseId: number
	): Promise<SuccessResponse<WarehouseHistoryWithDetails[]>> {
		const response = await instance.get<SuccessResponse<WarehouseHistoryWithDetails[]>>(
			`${this.baseUrl}/warehouse/${warehouseId}`
		);
		return response.data;
	}

	/**
	 * Получение истории изменений материалов по договору
	 */
	async getByAgreementId(
		agreementId: number
	): Promise<SuccessResponse<WarehouseHistoryWithDetails[]>> {
		const response = await instance.get<SuccessResponse<WarehouseHistoryWithDetails[]>>(
			`${this.baseUrl}/agreement/${agreementId}`
		);
		return response.data;
	}
}

export const warehouseHistoryService = new WarehouseHistoryService();
