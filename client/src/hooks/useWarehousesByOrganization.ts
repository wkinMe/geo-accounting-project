import { useQuery } from '@tanstack/react-query';
import { warehouseService } from '@/services/warehouseService';

export function useWarehousesByOrganization(organizationId: number | null, searchQuery: string) {
	const { data: warehouses, isLoading: isLoadingAll } = useQuery({
		queryKey: ['warehouses', 'organization', organizationId],
		queryFn: () => warehouseService.findByOrganizationId(organizationId!),
		enabled: !!organizationId,
	});

	const { data: searchedWarehouses, isLoading: isSearching } = useQuery({
		queryKey: ['warehouses', 'search', searchQuery, organizationId],
		queryFn: () => warehouseService.searchByOrganizationId(organizationId!, searchQuery),
		enabled: searchQuery.length > 0 && !!organizationId,
	});

	return {
		data: searchQuery ? searchedWarehouses?.data : warehouses?.data,
		isLoading: searchQuery ? isSearching : isLoadingAll,
	};
}
