import { userService } from '@/services/userService';
import type { UserWithOrganization } from '@shared/models';
import { FaRegTrashAlt } from 'react-icons/fa';
import { FaUserShield } from 'react-icons/fa';
import { FaCrown } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import type { Action, Column } from '@/components/shared/Table/types';
import { EntityList } from '@/components/shared/EntityList';
import { UserModal } from './UserModal';
import { useUsersListPermissions } from './hooks';
import { useProfile } from '@/hooks';
import { USER_ROLES } from '@shared/constants';
import { mapUserToTableItem } from './utils';
import type { TableUser } from './types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const columns: Column<TableUser>[] = [
	{ key: 'id', label: 'ID' },
	{ key: 'name', label: 'Имя' },
	{ key: 'role_display', label: 'Роль' },
	{ key: 'organization', label: 'Организация' },
];

export function UsersList() {
	const { data: currentUser } = useProfile();
	const queryClient = useQueryClient();
	const { canEdit, canDelete, canMakeAdmin, canMakeSuperAdmin } =
		useUsersListPermissions(currentUser);

	const canCreate =
		currentUser?.role === USER_ROLES.SUPER_ADMIN || currentUser?.role === USER_ROLES.ADMIN;

	const organizationId =
		currentUser?.role === USER_ROLES.SUPER_ADMIN ? undefined : currentUser?.organization_id;

	const makeAdminMutation = useMutation({
		mutationFn: async (user: TableUser) => {
			await userService.update(user.id, { ...user, role: USER_ROLES.ADMIN });
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['users'] });
			await queryClient.invalidateQueries({ queryKey: ['users', 'search'] });
		},
	});

	const makeSuperAdminMutation = useMutation({
		mutationFn: async (user: TableUser) => {
			await userService.update(user.id, { ...user, role: USER_ROLES.SUPER_ADMIN });
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['users'] });
			await queryClient.invalidateQueries({ queryKey: ['users', 'search'] });
		},
	});

	const actions: Action<TableUser>[] = [
		{
			name: 'Редактировать',
			action: () => {},
			icon: <MdEdit />,
			hidden: (item) => !canEdit(item),
		},
		{
			name: 'Сделать администратором',
			action: (item) => {
				makeAdminMutation.mutate(item);
			},
			icon: <FaUserShield />,
			hidden: (item) => !canMakeAdmin(item),
		},
		{
			name: 'Сделать главным администратором',
			action: (item) => {
				makeSuperAdminMutation.mutate(item);
			},
			icon: <FaCrown className="text-yellow-500" />,
			hidden: (item) => !canMakeSuperAdmin(item),
		},
		{
			name: 'Удалить',
			action: async () => {},
			icon: <FaRegTrashAlt />,
			needConfirmation: true,
			hidden: (item) => !canDelete(item),
		},
	];

	return (
		<EntityList
			config={{
				entityName: 'users',
				itemName: 'пользователя',
				service: {
					findAll: (page, limit, sortBy, sortOrder) =>
						userService.findAll(page, limit, sortBy, sortOrder, organizationId),
					search: (query, page, limit, sortBy, sortOrder) =>
						userService.search(query, page, limit, sortBy, sortOrder, organizationId),
					delete: userService.delete.bind(userService),
					create: async (data) => {
						const response = await userService.register(data);
						return response.user;
					},
					update: userService.update.bind(userService),
				},
				columns,
				mapToTableItem: mapUserToTableItem,
				actions,
				canCreate,
				initialSortBy: 'id',
				initialSortOrder: 'ASC',
				defaultLimit: 20,
				renderModal: ({ open, setOpen, selectedItem, onSubmit }) => (
					<UserModal
						open={open}
						setOpen={setOpen}
						user={selectedItem}
						onSubmit={onSubmit}
						currentUserRole={currentUser?.role}
					/>
				),
			}}
		/>
	);
}
