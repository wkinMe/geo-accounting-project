// client/src/hooks/useMaterialsByWarehouse.ts
import { useQuery } from '@tanstack/react-query';
import { warehouseService } from '@/services/warehouseService';

export function useMaterialsByWarehouse(warehouseId: number | null, searchQuery: string) {
	// Получаем все материалы со склада (при пустом поиске)
	const { data: allMaterials, isLoading: isLoadingAll } = useQuery({
		queryKey: ['warehouseMaterials', warehouseId],
		queryFn: () => warehouseService.getMaterials(warehouseId!),
		enabled: !!warehouseId,
	});

	// Поиск материалов (при введённом запросе)
	const { data: searchedMaterials, isLoading: isSearching } = useQuery({
		queryKey: ['materials', 'search', searchQuery, warehouseId],
		queryFn: () => warehouseService.searchMaterials(warehouseId!, searchQuery),
		enabled: searchQuery.length > 0 && !!warehouseId,
	});

	// Если есть поисковый запрос - показываем результаты поиска, иначе все материалы
	const data = searchQuery ? searchedMaterials?.data : allMaterials?.data;

	return {
		data,
		isLoading: searchQuery ? isSearching : isLoadingAll,
	};
}
