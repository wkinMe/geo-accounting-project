// client/src/pages/users/utils.ts
import type { UserWithOrganization } from '@shared/models';

export const mapUserToTableItem = (user: UserWithOrganization) => {
	// Функция для перевода роли на русский язык
	const getRoleDisplay = (role: string) => {
		const roles: Record<string, string> = {
			super_admin: 'Главный администратор',
			admin: 'Администратор',
			manager: 'Менеджер',
			user: 'Пользователь',
		};
		return roles[role] || role;
	};

	return {
		id: user.id,
		name: user.name,
		role: user.role,
		role_display: getRoleDisplay(user.role),
		organization: user.organization?.name || '—',
		organization_id: user.organization?.id,
		// created_at: new Date(user.created_at).toLocaleDateString('ru-RU'),
		// updated_at: new Date(user.updated_at).toLocaleDateString('ru-RU'),
	};
};
