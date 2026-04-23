// client/src/components/shared/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router';
import Spinner from '../Spinner';
import { useProfile } from '@/hooks';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const location = useLocation();

	const { data: profile, isLoading, error } = useProfile();

	if (isLoading) {
		return <Spinner fullScreen blur show={isLoading} fadeIn delay={2000} blurDelay={0} />;
	}

	if (!profile || error) {
		// Очищаем токен при ошибке
		localStorage.removeItem('token');
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return children;
}
