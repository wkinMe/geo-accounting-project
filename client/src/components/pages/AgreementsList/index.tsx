// client/src/pages/agreements/AgreementsList.tsx
import { useState } from 'react';
import { Table, type Action } from '@/components/shared/Table';
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

// Заголовки таблицы - используем поля из TableAgreement
const headers = [
	'id',
	'supplier',
	'customer',
	'status_display',
	'created_at',
	'updated_at',
] as const;

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
				headers={headers}
				elements={elements}
				actions={actions}
				onCreate={canCreate ? handleCreate : undefined}
			/>
		</>
	);
}
