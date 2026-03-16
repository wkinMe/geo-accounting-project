// client/src/pages/users/UsersList.tsx
import { useState } from 'react';
import { Table, type Action, type Column } from '@/components/shared/Table';
import { userService } from '@/services/userService';
import type { CreateUserDTO, UpdateUserDTO } from '@shared/dto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaRegTrashAlt } from 'react-icons/fa';
import { FaUserShield } from 'react-icons/fa';
import { FaCrown } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import { mapUserToTableItem } from './utils';
import { UserModal } from './UserModal';
import type { UserRole } from '@shared/models';

type TableUser = ReturnType<typeof mapUserToTableItem>;

const columns: Column<TableUser>[] = [
	{ key: 'id', label: 'ID' },
	{ key: 'name', label: 'Имя' },
	{ key: 'role_display', label: 'Роль' },
	{ key: 'organization', label: 'Организация' },
	{ key: 'created_at', label: 'Дата создания' },
	{ key: 'updated_at', label: 'Дата обновления' },
];

export function UsersList() {
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<{
		id: number;
		name: string;
		role: UserRole;
		organization_id?: number | null;
		created_at: string;
		updated_at: string;
	} | null>(null);

	// Получаем текущего пользователя
	const { data: currentUserData } = useQuery({
		queryKey: ['currentUser'],
		queryFn: () => userService.getProfile(),
		retry: false,
	});

	const currentUser = currentUserData?.data;

	const { data: users } = useQuery({
		queryKey: ['users'],
		queryFn: () => userService.findAll(),
	});

	const { data: searchedUsers } = useQuery({
		queryKey: ['users', 'search', searchQuery],
		queryFn: () => userService.search(searchQuery),
		enabled: searchQuery.length > 0,
		retry: false,
	});

	const { mutateAsync: deleteMutate } = useMutation({
		mutationFn: async (id: number) => userService.delete(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['users'] });
		},
	});

	const { mutateAsync: createMutate, isPending: isCreating } = useMutation({
		mutationFn: async (data: CreateUserDTO) => userService.register(data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['users'] });
			setTimeout(() => {
				setIsModalOpen(false);
				setSelectedUser(null);
			}, 300);
		},
	});

	const { mutateAsync: updateMutate, isPending: isUpdating } = useMutation({
		mutationFn: ({ data }: { data: UpdateUserDTO }) => userService.update(data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['users'] });
			setTimeout(() => {
				setIsModalOpen(false);
				setSelectedUser(null);
			}, 300);
		},
	});

	const elements =
		searchQuery && searchedUsers
			? searchedUsers.data.map(mapUserToTableItem)
			: users?.data.map(mapUserToTableItem) || [];

	const openEditModal = (user: TableUser) => {
		setSelectedUser({
			id: user.id,
			name: user.name,
			role: user.role,
			organization_id: user.organization_id,
			created_at: user.created_at,
			updated_at: user.updated_at,
		});
		setTimeout(() => {
			setIsModalOpen(true);
		}, 50);
	};

	const openCreateModal = () => {
		setSelectedUser(null);
		setIsModalOpen(true);
	};

	const handleSubmit = async (data: CreateUserDTO | UpdateUserDTO) => {
		if (selectedUser) {
			await updateMutate({ data: { ...data, id: selectedUser.id } as UpdateUserDTO });
		} else {
			await createMutate(data as CreateUserDTO);
		}
	};

	const handleMakeAdmin = async (userId: number) => {
		await updateMutate({
			data: { id: userId, role: 'admin' },
		});
	};

	const handleMakeSuperAdmin = async (userId: number) => {
		if (currentUser?.role !== 'super_admin') return;
		await updateMutate({
			data: { id: userId, role: 'super_admin' },
		});
	};

	// Проверка прав на редактирование пользователя
	const canEditUser = (user: TableUser) => {
		if (!currentUser) return false;

		// Super_admin может редактировать всех
		if (currentUser.role === 'super_admin') return true;

		// Admin может редактировать:
		// 1. Менеджеров своей организации
		// 2. Всех пользователей (любой организации)
		if (currentUser.role === 'admin') {
			// Если это менеджер своей организации - можно
			if (user.role === 'manager' && currentUser.organization_id === user.organization_id) {
				return true;
			}
			// Если это обычный пользователь (любой организации) - можно
			if (user.role === 'user') {
				return true;
			}
			// Нельзя редактировать админов и супер-админов
			return false;
		}

		return false;
	};

	// Проверка прав на удаление пользователя
	const canDeleteUser = (user: TableUser) => {
		if (!currentUser) return false;

		// Нельзя удалить самого себя
		if (user.id === currentUser.id) return false;

		// Super_admin может удалять всех, кроме себя
		if (currentUser.role === 'super_admin') return true;

		// Admin может удалять:
		// 1. Менеджеров своей организации
		// 2. Всех пользователей (любой организации)
		if (currentUser.role === 'admin') {
			// Если это менеджер своей организации - можно
			if (user.role === 'manager' && currentUser.organization_id === user.organization_id) {
				return true;
			}
			// Если это обычный пользователь (любой организации) - можно
			if (user.role === 'user') {
				return true;
			}
			// Нельзя удалять админов и супер-админов
			return false;
		}

		return false;
	};

	// Проверка прав на назначение админом
	const canMakeAdmin = (user: TableUser) => {
		if (!currentUser) return false;

		if (user.id === currentUser.id) return false;

		if (currentUser.role === 'super_admin') return true;
		if (currentUser.role === 'admin') {
			if (user.role === 'admin' || user.role === 'super_admin') return false;

			if (user.role === 'manager' && currentUser.organization_id === user.organization_id) {
				return true;
			}
			if (user.role === 'user') {
				return true;
			}
			return false;
		}

		return false;
	};

	// Проверка прав на назначение super_admin
	const canMakeSuperAdmin = (user: TableUser) => {
		if (!currentUser) return false;

		if (currentUser.role !== 'super_admin') return false;

		if (user.role === 'super_admin') return false;

		return true;
	};

	const actions: Action<TableUser>[] = [
		{
			name: 'Редактировать',
			action: (item) => openEditModal(item),
			icon: <MdEdit />,
			hidden: (item) => !canEditUser(item),
		},
		{
			name: 'Сделать администратором',
			action: (item) => handleMakeAdmin(item.id),
			icon: <FaUserShield />,
			hidden: (item) => !canMakeAdmin(item),
		},
		{
			name: 'Сделать главным администратором',
			action: (item) => handleMakeSuperAdmin(item.id),
			icon: <FaCrown className="text-yellow-500" />,
			hidden: (item) => !canMakeSuperAdmin(item),
		},
		{
			name: 'Удалить',
			action: async (item) => {
				if (confirm(`Вы уверены, что хотите удалить пользователя ${item.name}?`)) {
					await deleteMutate(item.id);
				}
			},
			icon: <FaRegTrashAlt />,
			needConfirmation: true,
			hidden: (item) => !canDeleteUser(item),
		},
	];

	// Проверка прав на создание нового пользователя
	const canCreate = () => {
		if (!currentUser) return false;
		// Super_admin и admin могут создавать пользователей
		return currentUser.role === 'super_admin' || currentUser.role === 'admin';
	};

	return (
		<>
			<Table
				searchValue={searchQuery}
				onSearch={setSearchQuery}
				debounceMs={300}
				itemName="Пользователь"
				columns={columns}
				elements={elements}
				actions={actions}
				onCreate={canCreate() ? openCreateModal : undefined}
			/>
			<UserModal
				open={isModalOpen}
				setOpen={setIsModalOpen}
				user={selectedUser}
				onSubmit={handleSubmit}
				isLoading={isCreating || isUpdating}
				currentUserRole={currentUser?.role}
			/>
		</>
	);
}
