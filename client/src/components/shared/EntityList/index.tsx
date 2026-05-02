import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaginatedTable } from '../PaginatedTable';
import { useTablePagination } from '@/hooks/useTablePagination';
import type { EntityConfig } from './types';

export function EntityList<T, TableItem extends { id: number }>({
	config,
	roundedT = true,
	roundedB = true,
}: {
	config: EntityConfig<T, TableItem>;
	roundedT?: boolean;
	roundedB?: boolean;
}) {
	const {
		entityName,
		itemName,
		service,
		columns,
		mapToTableItem,
		actions,
		hoverPopupConfig,
		canCreate = false,
		initialSortBy = 'id',
		initialSortOrder = 'ASC',
		defaultLimit = 20,
		renderModal,
		getIdField = (item: TableItem) => item.id, // по умолчанию берём id
	} = config;

	const queryClient = useQueryClient();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<TableItem | null>(null);

	const {
		page,
		limit,
		sortBy,
		sortOrder,
		searchQuery,
		handleSort,
		handlePageChange,
		handleLimitChange,
		handleSearch,
	} = useTablePagination({
		initialPage: 1,
		initialLimit: defaultLimit,
		initialSortBy,
		initialSortOrder,
	});

	const { data, isLoading, isFetching } = useQuery({
		queryKey: [entityName, page, limit, sortBy, sortOrder],
		queryFn: () => service.findAll(page, limit, sortBy, sortOrder),
		staleTime: 60 * 1000,
		gcTime: 2 * 60 * 1000,
		placeholderData: (previousData) => previousData,
		enabled: !searchQuery,
	});

	const {
		data: searchData,
		isLoading: isSearching,
		isFetching: isSearchFetching,
	} = useQuery({
		queryKey: [entityName, 'search', searchQuery, page, limit, sortBy, sortOrder],
		queryFn: () => service.search(searchQuery, page, limit, sortBy, sortOrder),
		enabled: searchQuery.length > 0,
		staleTime: 60 * 1000,
		gcTime: 2 * 60 * 1000,
		retry: false,
		placeholderData: (previousData) => previousData,
	});

	const { mutateAsync: deleteMutate } = useMutation({
		mutationFn: service.delete,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: [entityName] });
			await queryClient.invalidateQueries({ queryKey: [entityName, 'search'] });
		},
	});

	const { mutateAsync: createMutate } = useMutation({
		mutationFn: async (data: any) => {
			if (!service.create) throw new Error('Create method not implemented');
			return service.create(data);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: [entityName] });
			await queryClient.invalidateQueries({ queryKey: [entityName, 'search'] });
			setIsModalOpen(false);
			setSelectedItem(null);
		},
	});

	const { mutateAsync: updateMutate } = useMutation({
		mutationFn: async ({ id, data }: { id: number; data: any }) => {
			if (!service.update) throw new Error('Update method not implemented');
			return service.update(id, data);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: [entityName] });
			await queryClient.invalidateQueries({ queryKey: [entityName, 'search'] });
			setIsModalOpen(false);
			setSelectedItem(null);
		},
	});

	const currentData = searchQuery ? searchData : data;
	const elements = currentData?.data.map(mapToTableItem) || [];
	const total = currentData?.pagination.total || 0;
	const isLoadingData = searchQuery ? isSearching : isLoading;
	const isFetchingData = searchQuery ? isSearchFetching : isFetching;

	const openCreateModal = () => {
		setSelectedItem(null);
		setIsModalOpen(true);
	};

	const openEditModal = (item: TableItem) => {
		setSelectedItem(item);
		setIsModalOpen(true);
	};

	const handleSubmit = async (formData: any) => {
		if (selectedItem) {
			const id = getIdField(selectedItem);
			await updateMutate({ id, data: formData });
		} else {
			await createMutate(formData);
		}
	};

	// Обновляем actions - сохраняем оригинальную логику
	const actionsWithPermissions = actions?.map((action) => {
		// Для удаления с подтверждением - особая обработка
		if (action.needConfirmation) {
			return {
				...action,
				action: async (item: TableItem) => {
					const id = getIdField(item);
					await deleteMutate(id);
				},
			};
		}

		// Проверяем, есть ли у действия своя реализация
		const hasCustomAction = !!action.action;

		if (hasCustomAction) {
			return action;
		}

		return {
			...action,
			action: (item: TableItem) => openEditModal(item),
		};
	});

	return (
		<>
			<PaginatedTable
				roundedT={roundedT}
				roundedB={roundedB}
				columns={columns}
				itemName={itemName}
				elements={elements}
				total={total}
				actions={actionsWithPermissions}
				searchValue={searchQuery}
				sortBy={sortBy}
				sortOrder={sortOrder}
				currentPage={page}
				currentLimit={limit}
				isLoading={isLoadingData}
				isFetching={isFetchingData}
				hoverPopupConfig={hoverPopupConfig}
				isCreateDisabled={!canCreate}
				onSearch={handleSearch}
				onCreate={canCreate ? openCreateModal : undefined}
				onPageChange={handlePageChange}
				onLimitChange={handleLimitChange}
				onSort={handleSort}
			/>

			{renderModal &&
				renderModal({
					open: isModalOpen,
					setOpen: setIsModalOpen,
					selectedItem,
					onSubmit: handleSubmit,
				})}
		</>
	);
}
