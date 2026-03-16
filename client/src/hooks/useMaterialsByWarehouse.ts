// client/src/hooks/useMaterials.ts
import { useQuery } from '@tanstack/react-query';
import { warehouseService } from '@/services/warehouseService';

export function useMaterialsByWarehouse(warehouseId: number | null, searchQuery: string) {
	const { data: searchedMaterials, isLoading } = useQuery({
		queryKey: ['materials', 'search', searchQuery, warehouseId],
		queryFn: () => warehouseService.searchMaterials(warehouseId!, searchQuery),
		enabled: searchQuery.length > 0 && !!warehouseId,
	});

	return {
		data: searchedMaterials?.data,
		isLoading,
	};
}
