// client/src/services/agreementService.ts
import { instance } from '@/api/instance';
import type { CreateAgreementDTO, UpdateAgreementDTO } from '@shared/dto';
import type { Agreement, AgreementWithDetails } from '@shared/models';

interface AgreementMaterial {
	material_id: number;
	amount: number;
	item_price: number;
}

class AgreementService {
	private readonly baseUrl = '/agreements';

	async findAll(): Promise<AgreementWithDetails[]> {
		const response = await instance.get<{ success: boolean; data: AgreementWithDetails[] }>(
			`${this.baseUrl}/`
		);
		return response.data.data;
	}

	async findById(id: number): Promise<AgreementWithDetails> {
		const response = await instance.get<{ success: boolean; data: AgreementWithDetails }>(
			`${this.baseUrl}/${id}`
		);
		return response.data.data;
	}

	async create(
		createData: CreateAgreementDTO,
		materials?: AgreementMaterial[]
	): Promise<Agreement> {
		const response = await instance.post<{ success: boolean; data: Agreement }>(
			`${this.baseUrl}/`,
			{ ...createData, materials }
		);
		return response.data.data;
	}

	async update(
		id: number,
		updateData: UpdateAgreementDTO,
		materials?: AgreementMaterial[]
	): Promise<Agreement> {
		const response = await instance.put<{ success: boolean; data: Agreement }>(
			`${this.baseUrl}/${id}`,
			{ ...updateData, materials }
		);
		return response.data.data;
	}

	async delete(id: number): Promise<void> {
		const response = await instance.delete<{ success: boolean; message: string }>(
			`${this.baseUrl}/${id}`
		);
		if (!response.data.success) {
			throw new Error(response.data.message || 'Не удалось удалить договор');
		}
	}

	async search(query: string): Promise<AgreementWithDetails[]> {
		const response = await instance.get<{ success: boolean; data: AgreementWithDetails[] }>(
			`${this.baseUrl}/search`,
			{ params: { q: query } }
		);
		return response.data.data;
	}
}

export const agreementService = new AgreementService();
