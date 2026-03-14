// client/src/components/shared/RoleRoute.tsx
import { userService } from '@/services';
import { useQuery } from '@tanstack/react-query';
import Spinner from '../Spinner';
import { Navigate } from 'react-router';
import { type UserRole } from '@shared/models';

interface Props {
	children: React.ReactNode;
	allowedRoles?: UserRole[]; // Разрешённые роли
	deniedRoles?: UserRole[]; // Запрещённые роли
	fallbackPath?: string; // Куда перенаправлять при отсутствии доступа
}

export function RoleRoute({
	children,
	allowedRoles = [],
	deniedRoles = [],
	fallbackPath = '/',
}: Props) {
	const { data: profile, isLoading } = useQuery({
		queryKey: ['profile'],
		queryFn: () => userService.getProfile(),
		retry: false,
	});

	if (isLoading) {
		return <Spinner fullScreen blur />;
	}

	const userRole = profile?.data?.role;

	// Если пользователь не авторизован
	if (!userRole) {
		return <Navigate to="/login" replace />;
	}

	// Проверка на запрещённые роли
	if (deniedRoles.length > 0 && deniedRoles.includes(userRole)) {
		return <Navigate to={fallbackPath} replace />;
	}

	// Проверка на разрешённые роли (если список не пустой)
	if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
		return <Navigate to={fallbackPath} replace />;
	}

	return children;
}
