// Хук для получения все пользователей с привелегиями

import { useMemo } from 'react';
import type { User } from '@shared/models';
import { USER_ROLES } from '@shared/constants';

export function useFilteredUsers(users: User[] | undefined) {
	return useMemo(() => {
		if (!users) return [];

		return users.filter(
			(user) => user.role === USER_ROLES.MANAGER || user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN
		);
	}, [users]);
}
