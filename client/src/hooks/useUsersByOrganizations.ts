// client/src/hooks/useUsersByOrganization.ts
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';

const MAX_LIMIT = 1000;

export function useUsersByOrganization(organizationId: number | null, searchQuery: string) {
	// Получаем всех пользователей организации (без поиска)
	const { data: users, isLoading: isLoadingAll } = useQuery({
		queryKey: ['users', 'organization', organizationId],
		queryFn: () => userService.findByOrganizationId(organizationId!),
		enabled: !!organizationId,
	});

	// Поиск пользователей по имени в рамках организации
	const { data: searchedUsers, isLoading: isSearching } = useQuery({
		queryKey: ['users', 'search', searchQuery, organizationId],
		queryFn: () =>
			userService.search(searchQuery, 1, MAX_LIMIT, undefined, undefined, organizationId!),
		enabled: searchQuery.length > 0 && !!organizationId,
	});

	return {
		data: searchQuery ? searchedUsers?.data : users,
		isLoading: searchQuery ? isSearching : isLoadingAll,
	};
}
