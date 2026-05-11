// client/src/components/shared/EntityList/index.tsx
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaginatedTable } from '../PaginatedTable';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useDebounce } from '@/hooks/useDebounce';
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
		getIdField = (item: TableItem) => item.id,
		onRowClick, // Добавляем onRowClick
	} = config;

	const queryClient = useQueryClient();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<TableItem | null>(null);
	const [localSearchQuery, setLocalSearchQuery] = useState('');

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

	const debouncedHandleSearch = useDebounce((query: string) => {
		handleSearch(query);
	}, 100);

	const onSearch = useCallback(
		(query: string) => {
			setLocalSearchQuery(query);
			debouncedHandleSearch(query);
		},
		[debouncedHandleSearch]
	);

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

	const actionsWithPermissions = actions?.map((action) => {
		if (action.needConfirmation) {
			return {
				...action,
				action: async (item: TableItem) => {
					const id = getIdField(item);
					await deleteMutate(id);
				},
			};
		}

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
				searchValue={localSearchQuery}
				sortBy={sortBy}
				sortOrder={sortOrder}
				currentPage={page}
				currentLimit={limit}
				isLoading={isLoadingData}
				isFetching={isFetchingData}
				hoverPopupConfig={hoverPopupConfig}
				isCreateDisabled={!canCreate}
				onRowClick={onRowClick} // Передаём onRowClick в PaginatedTable
				onSearch={onSearch}
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
