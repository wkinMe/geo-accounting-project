// client/src/pages/organizations/OrganizationsList.tsx
import { useState } from 'react';
import { Table } from '@/components/shared/Table';
import { organizationService } from '@/services/organizationService';
import { userService } from '@/services/userService';
import type { CreateOrganizationDTO, UpdateOrganizationDTO } from '@shared/dto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import { useNavigate } from 'react-router';
import { OrganizationModal } from './components';
import type { Action, Column } from '@/components/shared/Table/types';

type TableOrganization = {
	id: number;
	name: string;
	created_at: string;
	updated_at: string;
};

const columns: Column<TableOrganization>[] = [
	{ key: 'id', label: 'ID' },
	{ key: 'name', label: 'Название' },
	{ key: 'created_at', label: 'Дата создания' },
	{ key: 'updated_at', label: 'Дата обновления' },
];

const mapOrganizationToTableItem = (org: any): TableOrganization => ({
	id: org.id,
	name: org.name,
	created_at: new Date(org.created_at).toLocaleDateString('ru-RU'),
	updated_at: new Date(org.updated_at).toLocaleDateString('ru-RU'),
});

export function OrganizationsList() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedOrganization, setSelectedOrganization] = useState<{
		id: number;
		name: string;
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
	const isSuperAdmin = currentUser?.role === 'super_admin';

	const { data: organizations } = useQuery({
		queryKey: ['organizations'],
		queryFn: () => organizationService.findAll(),
	});

	const { data: searchedOrganizations } = useQuery({
		queryKey: ['organizations', 'search', searchQuery],
		queryFn: () => organizationService.search(searchQuery),
		enabled: searchQuery.length > 0,
		retry: false,
	});

	const { mutateAsync: deleteMutate } = useMutation({
		mutationFn: async (id: number) => organizationService.delete(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['organizations'] });
		},
	});

	const { mutateAsync: createMutate, isPending: isCreating } = useMutation({
		mutationFn: async (data: CreateOrganizationDTO) => organizationService.create(data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['organizations'] });
			setTimeout(() => {
				setIsModalOpen(false);
				setSelectedOrganization(null);
			}, 300);
		},
	});

	const { mutateAsync: updateMutate, isPending: isUpdating } = useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateOrganizationDTO }) =>
			organizationService.update(id, data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['organizations'] });
			setTimeout(() => {
				setIsModalOpen(false);
				setSelectedOrganization(null);
			}, 300);
		},
	});

	const elements =
		searchQuery && searchedOrganizations
			? searchedOrganizations.data.map(mapOrganizationToTableItem)
			: organizations?.data.map(mapOrganizationToTableItem) || [];

	const openEditModal = (org: TableOrganization) => {
		setSelectedOrganization(org);
		setTimeout(() => {
			setIsModalOpen(true);
		}, 50);
	};

	const openCreateModal = () => {
		setSelectedOrganization(null);
		setIsModalOpen(true);
	};

	const handleSubmit = async (data: CreateOrganizationDTO | UpdateOrganizationDTO) => {
		if (selectedOrganization) {
			await updateMutate({ id: selectedOrganization.id, data: data as UpdateOrganizationDTO });
		} else {
			await createMutate(data as CreateOrganizationDTO);
		}
	};

	// Только суперадмин может редактировать и удалять
	const canModify = () => isSuperAdmin;

	const actions: Action<TableOrganization>[] = [
		{
			name: 'Редактировать',
			action: (item: TableOrganization) => openEditModal(item),
			icon: <MdEdit />,
			hidden: () => !canModify(),
		},
		{
			name: 'Удалить',
			action: async (item: TableOrganization) => {
				await deleteMutate(item.id);
			},
			icon: <FaRegTrashAlt />,
			needConfirmation: true,
			hidden: () => !canModify(),
		},
	];

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setTimeout(() => {
			setSelectedOrganization(null);
		}, 300);
	};

	return (
		<>
			<Table
				searchValue={searchQuery}
				onSearch={setSearchQuery}
				debounceMs={300}
				itemName="Организацию"
				columns={columns}
				elements={elements}
				actions={actions}
				onCreate={canModify() ? openCreateModal : undefined}
			/>
			<OrganizationModal
				open={isModalOpen}
				setOpen={(open) => {
					if (!open) handleCloseModal();
					else setIsModalOpen(true);
				}}
				organization={selectedOrganization}
				onSubmit={handleSubmit}
				isLoading={isCreating || isUpdating}
			/>
		</>
	);
}
