// client/src/services/warehouseService.ts

import { instance } from '@/api/instance';
import type { CreateWarehouseDTO, UpdateWarehouseDTO } from '@shared/dto';
import type {
	Warehouse,
	WarehouseWithMaterialsAndOrganization,
	WarehouseMaterial,
	Material,
} from '@shared/models';
import type { SuccessResponse } from '@shared/types';

class WarehouseService {
	private readonly baseUrl = '/warehouses';

	/**
	 * Получение всех складов с материалами и организацией
	 */
	async findAll(): Promise<SuccessResponse<WarehouseWithMaterialsAndOrganization[]>> {
		const response = await instance.get<SuccessResponse<WarehouseWithMaterialsAndOrganization[]>>(
			`${this.baseUrl}/`
		);
		return response.data;
	}

	/**
	 * Получение склада по ID
	 */
	async findById(id: number): Promise<SuccessResponse<WarehouseWithMaterialsAndOrganization>> {
		const response = await instance.get<SuccessResponse<WarehouseWithMaterialsAndOrganization>>(
			`${this.baseUrl}/${id}`
		);
		return response.data;
	}

	/**
	 * Создание нового склада
	 */
	async create(
		data: CreateWarehouseDTO
	): Promise<SuccessResponse<WarehouseWithMaterialsAndOrganization>> {
		const response = await instance.post<SuccessResponse<WarehouseWithMaterialsAndOrganization>>(
			`${this.baseUrl}/`,
			data
		);
		return response.data;
	}

	/**
	 * Обновление склада
	 */
	async update(
		id: number,
		data: UpdateWarehouseDTO
	): Promise<SuccessResponse<WarehouseWithMaterialsAndOrganization>> {
		const response = await instance.patch<SuccessResponse<WarehouseWithMaterialsAndOrganization>>(
			`${this.baseUrl}/${id}`,
			data
		);
		return response.data;
	}

	/**
	 * Удаление склада
	 */
	async delete(id: number): Promise<SuccessResponse<Warehouse>> {
		const response = await instance.delete<SuccessResponse<Warehouse>>(`${this.baseUrl}/${id}`);
		return response.data;
	}

	/**
	 * Поиск складов по запросу
	 */
	async search(query: string): Promise<SuccessResponse<WarehouseWithMaterialsAndOrganization[]>> {
		const response = await instance.get<SuccessResponse<WarehouseWithMaterialsAndOrganization[]>>(
			`${this.baseUrl}/search`,
			{
				params: { q: query },
			}
		);
		return response.data;
	}

	/**
	 * Получение складов по менеджеру
	 */
	async findByManagerId(
		managerId: number
	): Promise<SuccessResponse<WarehouseWithMaterialsAndOrganization[]>> {
		const response = await instance.get<SuccessResponse<WarehouseWithMaterialsAndOrganization[]>>(
			`${this.baseUrl}/manager/${managerId}`
		);
		return response.data;
	}

	/**
	 * Назначение менеджера на склад
	 */
	async assignManager(
		warehouseId: number,
		managerId: number | null
	): Promise<SuccessResponse<WarehouseWithMaterialsAndOrganization>> {
		const response = await instance.patch<SuccessResponse<WarehouseWithMaterialsAndOrganization>>(
			`${this.baseUrl}/${warehouseId}/assign-manager`,
			{ managerId }
		);
		return response.data;
	}

	/**
	 * Добавление материала на склад
	 */
	async addMaterial(
		warehouseId: number,
		materialId: number,
		amount: number
	): Promise<SuccessResponse<WarehouseMaterial>> {
		const response = await instance.post<SuccessResponse<WarehouseMaterial>>(
			`${this.baseUrl}/${warehouseId}/materials`,
			{ materialId, amount }
		);
		return response.data;
	}

	/**
	 * Обновление количества материала на складе
	 */
	async updateMaterialAmount(
		warehouseId: number,
		materialId: number,
		amount: number
	): Promise<SuccessResponse<WarehouseMaterial>> {
		const response = await instance.patch<SuccessResponse<WarehouseMaterial>>(
			`${this.baseUrl}/${warehouseId}/materials/${materialId}`,
			{ amount }
		);
		return response.data;
	}

	/**
	 * Удаление материала со склада
	 */
	async removeMaterial(
		warehouseId: number,
		materialId: number
	): Promise<SuccessResponse<WarehouseMaterial>> {
		const response = await instance.delete<SuccessResponse<WarehouseMaterial>>(
			`${this.baseUrl}/${warehouseId}/materials/${materialId}`
		);
		return response.data;
	}

	/**
	 * Получение всех материалов на складе
	 */
	async getMaterials(
		warehouseId: number
	): Promise<SuccessResponse<(WarehouseMaterial & { material: Material })[]>> {
		const response = await instance.get<
			SuccessResponse<(WarehouseMaterial & { material: Material })[]>
		>(`${this.baseUrl}/${warehouseId}/materials`);
		return response.data;
	}

	/**
	 * Поиск материалов на складе
	 */
	async searchMaterials(
		warehouseId: number,
		query: string
	): Promise<SuccessResponse<(WarehouseMaterial & { material: Material })[]>> {
		const response = await instance.get<
			SuccessResponse<(WarehouseMaterial & { material: Material })[]>
		>(`${this.baseUrl}/${warehouseId}/materials/search`, {
			params: { q: query },
		});
		return response.data;
	}

	/**
	 * Получение складов по организации
	 */
	async findByOrganizationId(
		organizationId: number
	): Promise<SuccessResponse<WarehouseWithMaterialsAndOrganization[]>> {
		const response = await instance.get<SuccessResponse<WarehouseWithMaterialsAndOrganization[]>>(
			`${this.baseUrl}/organization/${organizationId}`
		);
		return response.data;
	}

	/**
	 * Поиск складов по организации
	 */
	async searchByOrganizationId(
		organizationId: number,
		query: string
	): Promise<SuccessResponse<WarehouseWithMaterialsAndOrganization[]>> {
		const response = await instance.get<SuccessResponse<WarehouseWithMaterialsAndOrganization[]>>(
			`${this.baseUrl}/organization/${organizationId}/search`,
			{
				params: { q: query },
			}
		);
		return response.data;
	}
}

// Создаем и экспортируем единственный экземпляр
export const warehouseService = new WarehouseService();
