// client/src/components/shared/Table/index.tsx
import { useState } from 'react';
import { ConfirmModal } from '../ConfirmModal';
import { SearchInput } from '../SearchInput';
import { Button } from '../Button';
import { getColumns, getVisibleActions } from './utils';
import type { Action, Column, HoverPopupConfig } from './types';
import { TableRow } from './components/TableRow';

interface Props<T extends { id: number }> {
	roundedT?: boolean;
	roundedB?: boolean;
	headers?: readonly (keyof T)[];
	columns?: Column<T>[];
	itemName: string;
	elements: T[];
	actions?: Action<T>[];
	searchValue?: string;
	debounceMs?: number;
	isCreateDisabled?: boolean;
	onSearch?: (query: string) => void;
	onCreate?: () => void;
	onSort?: (column: string) => void;
	sortBy?: string;
	sortOrder?: 'ASC' | 'DESC';
	hoverPopupConfig?: HoverPopupConfig<T>;
}

export function Table<T extends { id: number }>({
	roundedB = true,
	roundedT = true,
	headers,
	columns,
	itemName,
	elements,
	actions,
	searchValue,
	debounceMs,
	isCreateDisabled = false,
	onSearch,
	onCreate,
	onSort,
	sortBy,
	sortOrder,
	hoverPopupConfig,
}: Props<T>) {
	const [openModal, setOpenModal] = useState(false);
	const [currentAction, setCurrentAction] = useState<null | Action<T>>(null);
	const [currentItem, setCurrentItem] = useState<null | T>(null);
	const [error, setError] = useState<string | null>(null);

	const needConfirmation = actions?.some((i) => i.needConfirmation === true);
	const useColumns = getColumns<T>(columns, headers);

	const hasAnyVisibleActions = elements?.some(
		(item) => actions && getVisibleActions<T>(item, actions).length > 0
	);

	const handleActionClick = (action: Action<T>, item: T) => {
		if (!action.needConfirmation) {
			action.action(item);
		} else {
			setError(null);
			setOpenModal(true);
			setCurrentItem(item);
			setCurrentAction(action);
		}
	};

	const handleConfirm = async () => {
		if (currentAction && currentItem) {
			setError(null);
			try {
				await currentAction.action(currentItem);
				setOpenModal(false);
				setCurrentAction(null);
				setCurrentItem(null);
			} catch (err: any) {
				const errorMessage = err?.response?.data?.error || err?.message || 'Произошла ошибка';
				setError(errorMessage);
				throw new Error(errorMessage);
			} finally {
			}
		}
	};

	return (
		<>
			{needConfirmation && (
				<ConfirmModal
					onConfirm={handleConfirm}
					actionName={currentAction?.name}
					open={openModal}
					setOpen={setOpenModal}
					error={error}
				>
					<div className="h-30">
						{currentAction?.confirmationBody && currentItem ? (
							currentAction.confirmationBody(currentItem)
						) : (
							<>
								Вы уверены, что хотите {currentAction?.name?.toLocaleLowerCase()}{' '}
								{itemName.toLocaleLowerCase()}?
							</>
						)}
					</div>
				</ConfirmModal>
			)}

			<div
				className={`overflow-x-auto ${roundedB && `rounded-b-2xl`} ${roundedT && `rounded-t-2xl`} border border-gray-200 bg-white dark:border-gray-800`}
			>
				<div className="flex items-center p-3 gap-3">
					{onSearch && (
						<SearchInput
							value={searchValue ?? ''}
							ms={debounceMs ?? 300}
							onSearch={onSearch}
							className="flex-1"
						/>
					)}
					{onCreate && !isCreateDisabled && (
						<Button className="cursor-pointer" onClick={onCreate}>
							Добавить {itemName.toLocaleLowerCase()}
						</Button>
					)}
				</div>

				{elements && elements.length === 0 ? (
					<div className="divide-y divide-gray-200 dark:divide-gray-800 flex justify-center items-center min-h-48">
						<span className="text-xl">Элементы не найдены</span>
					</div>
				) : (
					<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
						<thead className="bg-gray-50 dark:bg-gray-900">
							<tr>
								{useColumns.map((col, idx) => (
									<th
										key={idx}
										scope="col"
										onClick={() => onSort?.(col.key as string)}
										className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
											col.width ? `w-${col.width}` : ''
										}`}
									>
										<div className="flex items-center gap-1">
											{col.label}
											{sortBy === col.key && (
												<span className="text-gray-400">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
											)}
										</div>
									</th>
								))}
								{hasAnyVisibleActions && (
									<th
										scope="col"
										className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
									>
										Действия
									</th>
								)}
							</tr>
						</thead>
						<tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-gray-800">
							{elements.map((item) => {
								const visibleActions = getVisibleActions<T>(item, actions);
								return (
									<TableRow
										key={item.id}
										item={item}
										columns={useColumns}
										visibleActions={visibleActions}
										onActionClick={handleActionClick}
										hoverPopupConfig={hoverPopupConfig}
									/>
								);
							})}
						</tbody>
					</table>
				)}
			</div>
		</>
	);
}
