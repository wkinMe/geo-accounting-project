// client/src/hooks/useOrganizations.ts
import { useQuery } from '@tanstack/react-query';
import { organizationService } from '@/services/organizationService';

export function useOrganizations(searchQuery: string, fixedOrganizationId?: number | null) {
	// Если передан фиксированный ID организации, возвращаем только её
	const { data: fixedOrg, isLoading: isLoadingFixed } = useQuery({
		queryKey: ['organization', fixedOrganizationId],
		queryFn: () => organizationService.findById(fixedOrganizationId!),
		enabled: !!fixedOrganizationId && fixedOrganizationId > 0,
	});

	// Поиск организаций (только если нет фиксированной)
	const { data: searchedOrgs, isLoading: isSearching } = useQuery({
		queryKey: ['organizations', 'search', searchQuery],
		queryFn: () => organizationService.search(searchQuery),
		enabled: !fixedOrganizationId && searchQuery.length > 0,
	});

	// Все организации (только если нет фиксированной)
	const { data: allOrgs, isLoading: isLoadingAll } = useQuery({
		queryKey: ['organizations'],
		queryFn: () => organizationService.findAll(),
		enabled: !fixedOrganizationId && searchQuery.length === 0,
	});

	if (fixedOrganizationId && fixedOrg) {
		return {
			data: [fixedOrg],
			isLoading: isLoadingFixed,
		};
	}

	return {
		data: searchQuery ? searchedOrgs : allOrgs,
		isLoading: searchQuery ? isSearching : isLoadingAll,
	};
}
