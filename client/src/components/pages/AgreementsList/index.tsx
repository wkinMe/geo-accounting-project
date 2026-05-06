// client/src/pages/agreements/AgreementsList.tsx
import { useState, useMemo } from 'react';
import { agreementService } from '@/services/agreementService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaRegEye } from 'react-icons/fa';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import { useNavigate } from 'react-router';
import { mapAgreementToTableItem } from './utils';
import type { TableAgreement } from './types';
import type { Action, Column } from '@/components/shared/Table/types';
import { Table } from '@/components/shared/Table';
import { useAgreementBasePermissions } from './hooks';
import { AGREEMENT_STATUS, IRREVERSIBLE_STATUSES } from '@shared/constants/agreementStatuses';

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

	const { data: agreements } = useQuery({
		queryKey: ['agreements'],
		queryFn: () => agreementService.findAll(),
	});

	const { data: searchedAgreements } = useQuery({
		queryKey: ['agreements', 'search', searchQuery],
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

	const { canEdit, canDelete: canDeleteBase } = useAgreementBasePermissions();

	// Функция для проверки, можно ли удалить договор
	const canDeleteAgreement = (status: string) => {
		// Если пользователь супер-админ, может удалить любой договор
		if (canDeleteBase()) return true;

		// Если договор в статусе draft или pending - можно удалить
		if (status === AGREEMENT_STATUS.DRAFT || status === AGREEMENT_STATUS.PENDING) {
			return true;
		}

		// Активные статусы - нельзя удалить обычным пользователям
		return false;
	};

	// Функция для получения текста подтверждения удаления
	const getDeleteConfirmationBody = (agreementStatus: string) => {
		const isIrreversible = IRREVERSIBLE_STATUSES.includes(agreementStatus as any);
		const isSuperAdmin = canDeleteBase();

		if (isIrreversible && isSuperAdmin) {
			return (
				<div className="space-y-4">
					{' '}
					<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
						<span className="text-red-600 dark:text-red-400 text-lg">⚠️</span>
						<span className="text-red-700 dark:text-red-300 font-medium">
							Внимание! Договор находится в необратимом статусе!
						</span>
					</div>
					<p>Вы уверены, что хотите удалить договор?</p>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						При удалении договора будут также удалены все связанные записи в истории перемещения
						материалов. Восстановление будет невозможно.
					</p>
					<div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
						<p className="text-sm text-yellow-800 dark:text-yellow-300">
							⚠️ Будут удалены все записи о списании и поступлении материалов, связанные с этим
							договором.
						</p>
					</div>
				</div>
			);
		}

		return (
			<div className="space-y-2">
				<p>Вы уверены, что хотите удалить договор?</p>
			</div>
		);
	};

	const elements = useMemo(() => {
		const items =
			searchQuery && searchedAgreements
				? searchedAgreements.map(mapAgreementToTableItem)
				: agreements?.map(mapAgreementToTableItem) || [];

		return items.map((item) => ({
			...item,
			_canEdit: canEdit(),
			_canDelete: canDeleteAgreement(item.status),
			_status: item.status,
		}));
	}, [searchQuery, searchedAgreements, agreements, canEdit, canDeleteAgreement]);

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
			hidden: (item: TableAgreement) => !(item as any)._canEdit,
		},
		{
			name: 'Удалить',
			action: async (item: TableAgreement) => {
				await deleteMutate(item.id);
			},
			icon: <FaRegTrashAlt />,
			needConfirmation: true,
			confirmationBody: (item: TableAgreement) => getDeleteConfirmationBody(item.status),
			hidden: (item: TableAgreement) => !(item as any)._canDelete,
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
				onCreate={handleCreate}
			/>
		</>
	);
}
