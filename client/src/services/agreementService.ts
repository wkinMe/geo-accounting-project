// client/src/services/agreementService.ts
import { instance } from '@/api/instance';
import type { AgreementCreateParams, AgreementUpdateParams } from '@shared/types';
import type { Agreement, AgreementWithDetails } from '@shared/models';
import type { SuccessResponse } from '@shared/types';

class AgreementService {
	private readonly baseUrl = '/agreements';

	/**
	 * Получить все соглашения
	 */
	async findAll(): Promise<SuccessResponse<AgreementWithDetails[]>> {
		const response = await instance.get<SuccessResponse<AgreementWithDetails[]>>(
			`${this.baseUrl}/`
		);
		return response.data;
	}

	/**
	 * Получить соглашение по ID
	 */
	async findById(id: number): Promise<SuccessResponse<AgreementWithDetails>> {
		const response = await instance.get<SuccessResponse<AgreementWithDetails>>(
			`${this.baseUrl}/${id}`
		);
		return response.data;
	}

	/**
	 * Создать новое соглашение
	 */
	async create(data: AgreementCreateParams): Promise<SuccessResponse<Agreement>> {
		const response = await instance.post<SuccessResponse<Agreement>>(`${this.baseUrl}/`, data);
		return response.data;
	}

	/**
	 * Обновить существующее соглашение
	 */
	async update(data: AgreementUpdateParams): Promise<SuccessResponse<Agreement>> {
		const response = await instance.patch<SuccessResponse<Agreement>>(
			`${this.baseUrl}/${data.id}`,
			data
		);
		return response.data;
	}

	/**
	 * Удалить соглашение
	 */
	async delete(id: number): Promise<SuccessResponse<Agreement>> {
		const response = await instance.delete<SuccessResponse<Agreement>>(`${this.baseUrl}/${id}`);
		return response.data;
	}

	/**
	 * Поиск соглашений
	 */
	async search(query: string): Promise<SuccessResponse<AgreementWithDetails[]>> {
		const response = await instance.get<SuccessResponse<AgreementWithDetails[]>>(
			`${this.baseUrl}/search`,
			{
				params: { q: query },
			}
		);
		return response.data;
	}
}

// Создаем и экспортируем единственный экземпляр
export const agreementService = new AgreementService();
