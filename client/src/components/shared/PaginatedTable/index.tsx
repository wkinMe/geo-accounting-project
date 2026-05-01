// client/src/components/shared/PaginatedTable/index.tsx
import { useRef, useLayoutEffect } from 'react';
import { Table } from '../Table';
import type { Action, Column, HoverPopupConfig } from '../Table/types';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import { BiChevronsLeft, BiChevronsRight } from 'react-icons/bi';

interface PaginatedTableProps<T extends { id: number }> {
	roundedT?: boolean;
	roundedB?: boolean;
	headers?: readonly (keyof T)[];
	columns?: Column<T>[];
	itemName: string;
	elements: T[];
	total: number;
	actions?: Action<T>[];
	searchValue?: string;
	debounceMs?: number;
	isCreateDisabled?: boolean;
	isLoading?: boolean;
	isFetching?: boolean; // Добавляем isFetching
	sortBy?: string;
	sortOrder?: 'ASC' | 'DESC';
	hoverPopupConfig?: HoverPopupConfig<T>;
	currentPage?: number;
	currentLimit?: number;
	onSearch?: (query: string) => void;
	onCreate?: () => void;
	onPageChange: (page: number) => void;
	onLimitChange: (limit: number) => void;
	onSort?: (column: string, order: 'ASC' | 'DESC') => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function PaginatedTable<T extends { id: number }>({
	roundedT = true,
	roundedB = true,
	headers,
	columns,
	itemName,
	elements,
	total,
	actions,
	searchValue,
	debounceMs = 300,
	isCreateDisabled = false,
	isLoading = false,
	isFetching = false,
	sortBy,
	sortOrder,
	hoverPopupConfig,
	currentPage = 1,
	currentLimit = 20,
	onSearch,
	onCreate,
	onPageChange,
	onLimitChange,
	onSort,
}: PaginatedTableProps<T>) {
	const tableContainerRef = useRef<HTMLDivElement>(null);
	const totalPages = Math.ceil(total / currentLimit);

	const handleSort = (column: string) => {
		if (!onSort) return;

		const newOrder = sortBy === column && sortOrder === 'ASC' ? 'DESC' : 'ASC';
		onSort(column, newOrder);
	};

	const handlePageChange = (page: number) => {
		if (page < 1 || page > totalPages || page === currentPage) return;
		onPageChange(page);
	};

	const handleLimitChange = (newLimit: number) => {
		onLimitChange(newLimit);
	};

	// Скролл к началу таблицы при изменении страницы или лимита
	useLayoutEffect(() => {
		if (tableContainerRef.current) {
			tableContainerRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			});
		}
	}, [sortBy, sortOrder, currentPage, currentLimit]);

	const getPageNumbers = () => {
		const pages: (number | string)[] = [];
		const maxVisible = 5;

		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			if (currentPage <= 3) {
				for (let i = 1; i <= 4; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(totalPages);
			} else if (currentPage >= totalPages - 2) {
				pages.push(1);
				pages.push('...');
				for (let i = totalPages - 3; i <= totalPages; i++) {
					pages.push(i);
				}
			} else {
				pages.push(1);
				pages.push('...');
				for (let i = currentPage - 1; i <= currentPage + 1; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(totalPages);
			}
		}

		return pages;
	};

	return (
		<div ref={tableContainerRef} className="space-y-4">
			<div
				className={`transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}
			>
				<Table
					roundedT={roundedT}
					roundedB={false}
					headers={headers}
					columns={columns}
					itemName={itemName}
					elements={elements}
					actions={actions}
					searchValue={searchValue}
					debounceMs={debounceMs}
					isCreateDisabled={isCreateDisabled}
					onSearch={onSearch}
					onCreate={onCreate}
					onSort={onSort ? handleSort : undefined}
					sortBy={sortBy}
					sortOrder={sortOrder}
					hoverPopupConfig={hoverPopupConfig}
				/>
			</div>

			{/* Пагинация */}
			{total > 0 && (
				<div
					className={`flex items-center justify-between px-4 py-3 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 ${roundedB ? 'rounded-b-2xl' : ''}`}
				>
					<div className="text-sm text-gray-700 dark:text-gray-300">
						Показано {(currentPage - 1) * currentLimit + 1} -{' '}
						{Math.min(currentPage * currentLimit, total)} из {total}
					</div>

					<div className="flex items-center gap-2">
						<button
							onClick={() => handlePageChange(1)}
							disabled={currentPage === 1 || isLoading}
							className="cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							title="Первая страница"
						>
							<BiChevronsLeft className="w-4 h-4" />
						</button>

						<button
							onClick={() => handlePageChange(currentPage - 1)}
							disabled={currentPage === 1 || isLoading}
							className="cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							title="Предыдущая страница"
						>
							<BiChevronLeft className="w-4 h-4" />
						</button>

						<div className="flex items-center gap-1">
							{getPageNumbers().map((page, idx) =>
								typeof page === 'number' ? (
									<button
										key={idx}
										onClick={() => handlePageChange(page)}
										disabled={isLoading}
										className={`cursor-pointer px-3 py-1 rounded-md text-sm transition-colors ${
											currentPage === page
												? 'bg-black dark:bg-white text-white dark:text-black'
												: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
										} disabled:opacity-50 disabled:cursor-not-allowed`}
									>
										{page}
									</button>
								) : (
									<span key={idx} className="px-2 text-gray-500">
										...
									</span>
								)
							)}
						</div>

						<button
							onClick={() => handlePageChange(currentPage + 1)}
							disabled={currentPage === totalPages || isLoading}
							className="cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							title="Следующая страница"
						>
							<BiChevronRight className="w-4 h-4" />
						</button>

						<button
							onClick={() => handlePageChange(totalPages)}
							disabled={currentPage === totalPages || isLoading}
							className="cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							title="Последняя страница"
						>
							<BiChevronsRight className="w-4 h-4" />
						</button>

						<select
							value={currentLimit}
							onChange={(e) => handleLimitChange(Number(e.target.value))}
							disabled={isLoading}
							className="cursor-pointer ml-4 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-gray-900 dark:text-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{PAGE_SIZE_OPTIONS.map((size) => (
								<option key={size} value={size}>
									{size}
								</option>
							))}
						</select>
					</div>
				</div>
			)}
		</div>
	);
}
