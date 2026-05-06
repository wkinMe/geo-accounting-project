// client/src/hooks/useTablePagination.ts
import { useState, useCallback } from 'react';

interface UseTablePaginationProps {
	initialPage?: number;
	initialLimit?: number;
	initialSortBy?: string;
	initialSortOrder?: 'ASC' | 'DESC';
}

export function useTablePagination({
	initialPage = 1,
	initialLimit = 20,
	initialSortBy = 'id',
	initialSortOrder = 'ASC',
}: UseTablePaginationProps = {}) {
	const [page, setPage] = useState(initialPage);
	const [limit, setLimit] = useState(initialLimit);
	const [sortBy, setSortBy] = useState<string>(initialSortBy);
	const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(initialSortOrder);
	const [searchQuery, setSearchQuery] = useState('');

	const handleSort = useCallback((column: string, order: 'ASC' | 'DESC') => {
		setSortBy(column);
		setSortOrder(order);
		setPage(1);
	}, []);

	const handlePageChange = useCallback((newPage: number) => {
		setPage(newPage);
	}, []);

	const handleLimitChange = useCallback((newLimit: number) => {
		setLimit(newLimit);
		setPage(1);
	}, []);

	const handleSearch = useCallback((query: string) => {
		setSearchQuery(query);
		setPage(1);
	}, []);

	const resetPagination = useCallback(() => {
		setPage(initialPage);
		setLimit(initialLimit);
		setSortBy(initialSortBy);
		setSortOrder(initialSortOrder);
		setSearchQuery('');
	}, [initialPage, initialLimit, initialSortBy, initialSortOrder]);

	return {
		page,
		limit,
		sortBy,
		sortOrder,
		searchQuery,
		handleSort,
		handlePageChange,
		handleLimitChange,
		handleSearch,
		resetPagination,
	};
}
