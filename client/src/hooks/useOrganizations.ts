import { useQuery } from '@tanstack/react-query';
import { organizationService } from '@/services/organizationService';

export function useOrganizations(searchQuery: string) {
	const { data: organizations, isLoading: isLoadingAll } = useQuery({
		queryKey: ['organizations'],
		queryFn: () => organizationService.findAll(),
	});

	const { data: searchedOrgs, isLoading: isSearching } = useQuery({
		queryKey: ['organizations', 'search', searchQuery],
		queryFn: () => organizationService.search(searchQuery),
		enabled: searchQuery.length > 0,
	});

	return {
		data: searchQuery ? searchedOrgs?.data : organizations?.data,
		isLoading: searchQuery ? isSearching : isLoadingAll,
	};
}
