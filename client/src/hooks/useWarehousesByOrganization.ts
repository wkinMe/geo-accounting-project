// client/src/hooks/useWarehousesByOrganization.ts
import { useQuery } from '@tanstack/react-query';
import { warehouseService } from '@/services/warehouseService';

const MAX_LIMIT = 1000;

export function useWarehousesByOrganization(organizationId: number | null, searchQuery: string) {
	// Получаем все склады (с фильтром по организации или по менеджеру)
	const { data: warehouses, isLoading: isLoadingAll } = useQuery({
		queryKey: ['warehouses', 'organization', organizationId],
		queryFn: async () => {
			return await warehouseService.findAll(
				1,
				MAX_LIMIT,
				undefined,
				undefined,
				organizationId || undefined
			);
		},
		enabled: !!organizationId,
	});

	const { data: searchedWarehouses, isLoading: isSearching } = useQuery({
		queryKey: ['warehouses', 'search', searchQuery, organizationId],
		queryFn: async () => {
			return await warehouseService.search(
				searchQuery,
				1,
				MAX_LIMIT,
				undefined,
				undefined,
				organizationId || undefined
			);
		},
		enabled: searchQuery.length > 0 && !!organizationId,
	});

	return {
		data: searchQuery ? searchedWarehouses?.data : warehouses?.data,
		isLoading: searchQuery ? isSearching : isLoadingAll,
	};
}
