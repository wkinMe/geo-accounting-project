// client/src/hooks/useWarehousesByOrganization.ts
import { useQuery } from '@tanstack/react-query';
import { warehouseService } from '@/services/warehouseService';

export function useWarehousesByOrganization(organizationId: number | null, searchQuery: string) {
	// Получаем все склады организации (без поиска)
	const { data: warehouses, isLoading: isLoadingAll } = useQuery({
		queryKey: ['warehouses', 'organization', organizationId],
		queryFn: () => warehouseService.findAll(organizationId!),
		enabled: !!organizationId,
	});

	// Поиск складов по названию в рамках организации
	const { data: searchedWarehouses, isLoading: isSearching } = useQuery({
		queryKey: ['warehouses', 'search', searchQuery, organizationId],
		queryFn: () => warehouseService.search(searchQuery, organizationId!),
		enabled: searchQuery.length > 0 && !!organizationId,
	});

	return {
		data: searchQuery ? searchedWarehouses : warehouses,
		isLoading: searchQuery ? isSearching : isLoadingAll,
	};
}