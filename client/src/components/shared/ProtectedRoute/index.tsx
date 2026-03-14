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
		return (
			<Spinner
				fullScreen
				blur
				show={isLoading}
				fadeIn
				delay={2000} // спиннер через 2 секунды
				blurDelay={0} // блюр сразу
			/>
		);
	}

	if (!profile?.data) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return children;
}
