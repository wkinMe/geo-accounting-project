// client/src/pages/agreements/AgreementsList.tsx
import { useState } from 'react';
import { Table, type Action, type Column } from '@/components/shared/Table';
import { agreementService } from '@/services/agreementService';
import { userService } from '@/services/userService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaRegEye } from 'react-icons/fa';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import { useNavigate } from 'react-router';
import { mapAgreementToTableItem } from './utils';
import type { TableAgreement } from './types';
import { useAgreementPermissions } from './hooks/useAgreementPermissions';

const columns: Column<TableAgreement>[] = [
	{ key: 'id', label: 'ID' },
	{ key: 'supplier_organization', label: 'Поставщик' },
	{ key: 'customer_organization', label: 'Покупатель' },
	{
		key: 'status_display',
		label: 'Статус',
		render: (value, item) => (
			<span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status_color}`}>
				{value}
			</span>
		),
	},
	{ key: 'created_at', label: 'Дата создания' },
	{ key: 'updated_at', label: 'Дата обновления' },
];

export function AgreementsList() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [searchQuery, setSearchQuery] = useState('');

	// Получаем текущего пользователя
	const { data: currentUserData } = useQuery({
		queryKey: ['profile'],
		queryFn: () => userService.getProfile(),
		retry: false,
	});

	const currentUser = currentUserData?.data;

	// Используем хук с правами
	const { canEdit, canDelete, canCreate } = useAgreementPermissions(currentUser);

	const { data: agreements } = useQuery({
		queryKey: ['agreements'],
		queryFn: () => agreementService.findAll(),
	});

	const { data: searchedAgreements } = useQuery({
		queryKey: ['agreements', searchQuery],
		queryFn: () => agreementService.search(searchQuery),
		enabled: searchQuery.length > 0,
		retry: false,
	});

	const { mutateAsync: deleteMutate } = useMutation({
		mutationFn: async (id: number) => agreementService.delete(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['agreements'] });
		},
	});

	const handleCreate = () => {
		navigate('/agreements/new');
	};

	const handleEdit = (id: number) => {
		navigate(`/agreements/${id}/edit`);
	};

	const elements =
		searchQuery && searchedAgreements
			? searchedAgreements.data.map(mapAgreementToTableItem)
			: agreements?.data.map(mapAgreementToTableItem) || [];

	const actions: Action<TableAgreement>[] = [
		{
			name: 'Просмотреть',
			action: (item: TableAgreement) => navigate(`${item.id}`),
			icon: <FaRegEye />,
		},
		{
			name: 'Редактировать',
			action: (item: TableAgreement) => handleEdit(item.id),
			icon: <MdEdit />,
			hidden: (item: TableAgreement) => !canEdit(item),
		},
		{
			name: 'Удалить',
			action: async (item: TableAgreement) => {
				await deleteMutate(item.id);
			},
			icon: <FaRegTrashAlt />,
			needConfirmation: true,
			hidden: (item: TableAgreement) => !canDelete(item),
		},
	];

	return (
		<>
			<Table
				searchValue={searchQuery}
				onSearch={setSearchQuery}
				debounceMs={300}
				itemName="Договор"
				columns={columns}
				elements={elements}
				actions={actions}
				onCreate={canCreate ? handleCreate : undefined}
			/>
		</>
	);
}
