// Хук для получения все пользователей с привелегиями

import { useMemo } from 'react';
import type { User } from '@shared/models';

export function useFilteredUsers(users: User[] | undefined) {
	return useMemo(() => {
		if (!users) return [];

		return users.filter(
			(user) => user.role === 'manager' || user.role === 'admin' || user.role === 'super_admin'
		);
	}, [users]);
}
