import { userService } from '@/services';
import type { UserRole } from '@shared/models';
import { useQuery } from '@tanstack/react-query';

type UseQueryProps = Partial<ReturnType<typeof useQuery>>;

export function useRole(props?: UseQueryProps): UserRole | undefined {
	const { data } = useQuery({
		queryKey: ['profile'],
		queryFn: () => userService.getProfile(),
		...props,
	});

	return data?.data.role;
}