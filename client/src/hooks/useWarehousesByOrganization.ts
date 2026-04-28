// client/src/hooks/useWarehousesByOrganization.ts
import { useQuery } from '@tanstack/react-query';
import { warehouseService } from '@/services/warehouseService';

export function useWarehousesByOrganization(
	organizationId: number | null,
	searchQuery: string,
	managerId?: number | null
) {
	// Получаем все склады (с фильтром по организации или по менеджеру)
	const { data: warehouses, isLoading: isLoadingAll } = useQuery({
		queryKey: ['warehouses', 'organization', organizationId, managerId],
		queryFn: async () => {
			if (managerId) {
				// Если передан manager_id, ищем склады по менеджеру
				return await warehouseService.findByManagerId(managerId);
			}
			// Иначе по организации
			return await warehouseService.findAll(organizationId || undefined);
		},
		enabled: !!(organizationId || managerId),
	});

	// Поиск складов (с фильтрацией)
	const { data: searchedWarehouses, isLoading: isSearching } = useQuery({
		queryKey: ['warehouses', 'search', searchQuery, organizationId, managerId],
		queryFn: async () => {
			if (managerId) {
				// Поиск среди складов менеджера
				const allManagerWarehouses = await warehouseService.findByManagerId(managerId);
				if (searchQuery.length === 0) return allManagerWarehouses;
				return allManagerWarehouses.filter((w) =>
					w.name.toLowerCase().includes(searchQuery.toLowerCase())
				);
			}
			// Обычный поиск по организации
			return await warehouseService.search(searchQuery, organizationId || undefined);
		},
		enabled: searchQuery.length > 0 && !!(organizationId || managerId),
	});

	return {
		data: searchQuery ? searchedWarehouses : warehouses,
		isLoading: searchQuery ? isSearching : isLoadingAll,
	};
}
