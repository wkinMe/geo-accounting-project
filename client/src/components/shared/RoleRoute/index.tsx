// client/src/components/shared/RoleRoute.tsx
import Spinner from '../Spinner';
import { Navigate } from 'react-router';
import { type UserRole } from '@shared/models';
import { useProfile } from '@/hooks';

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
	const { data: userRole, isLoading } = useProfile().data?.role;

	if (isLoading) {
		return <Spinner fullScreen blur />;
	}

	// Проверка на запрещённые роли
	if (userRole && deniedRoles.length > 0 && deniedRoles.includes(userRole)) {
		return <Navigate to={fallbackPath} replace />;
	}

	// Проверка на разрешённые роли (если список не пустой)
	if (userRole && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
		return <Navigate to={fallbackPath} replace />;
	}

	return children;
}
