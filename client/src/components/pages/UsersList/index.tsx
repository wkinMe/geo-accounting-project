// client/src/pages/users/UsersList.tsx
import { useState } from 'react';
import { Table, type Action } from '@/components/shared/Table';
import { userService } from '@/services/userService';
import type { CreateUserDTO, UpdateUserDTO } from '@shared/dto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaRegEye } from 'react-icons/fa';
import { FaRegTrashAlt } from 'react-icons/fa';
import { FaUserShield } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import { useNavigate } from 'react-router';
import { mapUserToTableItem } from './utils';
import { UserModal } from './UserModal';
import type { UserRole } from '@shared/models';

const headers = ['id', 'name', 'role', 'organization', 'created_at', 'updated_at'] as const;

export function UsersList() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState('');

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<{
		id: number;
		name?: string;
		role: UserRole;
		organization?: string;
		organization_id?: number | null;
		created_at: string;
		updated_at: string;
	} | null>(null);

	const { data: users } = useQuery({
		queryKey: ['users'],
		queryFn: () => userService.findAll(),
	});

	const { data: profile } = useQuery({
		queryKey: ['profile'],
		queryFn: () => userService.getProfile(),
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

	const openEditModal = (user: (typeof elements)[0]) => {
		setSelectedUser(user);
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
			// Режим редактирования
			console.log(data);
			await updateMutate({ data: data as UpdateUserDTO });
		} else {
			// Режим создания
			await createMutate(data as CreateUserDTO);
		}
	};

	const handleMakeAdmin = async (userId: number) => {
		await updateMutate({
			data: { id: userId, role: 'admin' },
		});
	};

	const actions: Action<(typeof elements)[0]>[] = [
		{
			name: 'Просмотреть',
			action: (item) => navigate(`${item.id}`),
			icon: <FaRegEye />,
		},
		{
			name: 'Редактировать',
			action: (item) => openEditModal(item),
			icon: <MdEdit />,
		},
		{
			name: 'Сделать администратором',
			action: (item) => handleMakeAdmin(item.id),
			icon: <FaUserShield />,
		},
		{
			name: 'Удалить',
			action: async (item) => {
				await deleteMutate(item.id);
			},
			icon: <FaRegTrashAlt />,
			needConfirmation: true,
		},
	];

	return (
		<>
			<Table
				searchValue={searchQuery}
				onSearch={setSearchQuery}
				debounceMs={300}
				itemName="Пользователь"
				headers={headers}
				elements={elements}
				actions={actions}
				onCreate={openCreateModal}
			/>
			<UserModal
				open={isModalOpen}
				setOpen={setIsModalOpen}
				user={
					selectedUser
						? {
								id: selectedUser.id,
								name: selectedUser.name || '', // Убеждаемся, что name всегда строка
								role: selectedUser.role as UserRole, // Приводим к правильному типу
								organization_id: selectedUser.organization_id,
							}
						: null
				}
				onSubmit={handleSubmit}
				isLoading={isCreating || isUpdating}
				currentUserRole={profile?.data.role}
			/>
		</>
	);
}
