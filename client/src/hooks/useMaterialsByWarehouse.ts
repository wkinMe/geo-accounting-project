// client/src/hooks/useMaterialsByWarehouse.ts
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventoryService';

export function useMaterialsByWarehouse(warehouseId: number | null, searchQuery: string) {
	// Получаем все материалы со склада (при пустом поиске)
	const { data: allMaterials, isLoading: isLoadingAll } = useQuery({
		queryKey: ['warehouseStock', warehouseId],
		queryFn: () => inventoryService.getWarehouseStock(warehouseId!),
		enabled: !!warehouseId,
	});

	// Поиск материалов (при введённом запросе)
	const { data: searchedMaterials, isLoading: isSearching } = useQuery({
		queryKey: ['warehouseStock', warehouseId, 'search', searchQuery],
		queryFn: () => inventoryService.searchMaterials(warehouseId!, searchQuery),
		enabled: searchQuery.length > 0 && !!warehouseId,
	});

	// Если есть поисковый запрос - показываем результаты поиска, иначе все материалы
	const data = searchQuery ? searchedMaterials : allMaterials;

	return {
		data: data || [],
		isLoading: searchQuery ? isSearching : isLoadingAll,
	};
}
