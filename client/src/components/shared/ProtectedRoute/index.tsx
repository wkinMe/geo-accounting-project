import { userService } from '@/services';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router';
import Spinner from '../Spinner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const location = useLocation();

	const { data: profile, isLoading } = useQuery({
		queryKey: ['profile'],
		queryFn: () => userService.getProfile(),
		retry: false,
	});

	if (isLoading) {
		// fullScreen={true} и blur={true} (так как blur по умолчанию true)
		return <Spinner fullScreen blur />;
	}

	if (!profile?.data) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return children;
}
