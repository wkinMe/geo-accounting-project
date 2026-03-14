// client/src/hooks/useProfile.ts
import { userService } from '@/services';
import { useQuery } from '@tanstack/react-query';

export function useProfile() {
	const { data, isLoading, isError, error } = useQuery({
		queryKey: ['profile'],
		queryFn: () => userService.getProfile(),
		retry: false,
	});

	return {
		data: data?.data,
		isLoading,
		isError,
		error,
	};
}
