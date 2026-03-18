// client/src/hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';

export function useProfile() {
	return useQuery({
		queryKey: ['profile'],
		queryFn: () => userService.getProfile(),
		retry: 1,
	});
}
