// client/src/hooks/useUsersByOrganization.ts
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';

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
		queryFn: () => userService.search(searchQuery, organizationId!),
		enabled: searchQuery.length > 0 && !!organizationId,
	});

	return {
		data: searchQuery ? searchedUsers : users,
		isLoading: searchQuery ? isSearching : isLoadingAll,
	};
}
