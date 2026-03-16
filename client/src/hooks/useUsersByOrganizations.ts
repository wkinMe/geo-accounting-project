import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';

export function useUsersByOrganization(organizationId: number | null, searchQuery: string) {
	const { data: users, isLoading: isLoadingAll } = useQuery({
		queryKey: ['users', 'organization', organizationId],
		queryFn: () => userService.findByOrganizationId(organizationId!),
		enabled: !!organizationId,
	});

	const { data: searchedUsers, isLoading: isSearching } = useQuery({
		queryKey: ['users', 'search', searchQuery, organizationId],
		queryFn: () => userService.search(searchQuery, organizationId || undefined),
		enabled: searchQuery.length > 0 && !!organizationId,
	});

	return {
		data: searchQuery ? searchedUsers?.data : users?.data,
		isLoading: searchQuery ? isSearching : isLoadingAll,
	};
}
