import { userService } from '@/services';
import type { UserDataDTO } from '@shared/dto';
import { useQuery } from '@tanstack/react-query';

type UseQueryProps = Partial<ReturnType<typeof useQuery>>;

export function useProfile(props?: UseQueryProps): UserDataDTO | undefined {
	const { data } = useQuery({
		queryKey: ['profile'],
		queryFn: () => userService.getProfile(),
		...props,
	});

	return data?.data;
}
