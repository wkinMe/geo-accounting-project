// client/src/components/shared/Table/index.tsx

import { useState } from 'react';
import { ConfirmModal } from '../ConfirmModal';
import { SearchInput } from '../SearchInput';
import { Button } from '../Button';

export interface Action<T> {
	name: string;
	action: (item: T) => void | Promise<void>;
	icon: string | React.ReactNode;
	needConfirmation?: boolean;
	confirmationBody?: (item: T) => React.ReactNode;
	hidden?: (item: T) => boolean;
}

// Новый тип для колонки
export interface Column<T> {
	key: keyof T; // Ключ для доступа к данным
	label: string; // Отображаемый заголовок
	width?: string; // Опциональная ширина
	align?: 'left' | 'center' | 'right';
	render?: (value: any, item: T) => React.ReactNode;
}

interface Props<T extends { id: number }> {
	roundedT?: boolean;
	roundedB?: boolean;
	// Поддерживаем оба варианта для обратной совместимости
	headers?: readonly (keyof T)[];
	columns?: Column<T>[]; // Новый пропс
	itemName: string;
	elements: T[];
	actions?: Action<T>[];
	searchValue?: string;
	debounceMs?: number;
	isCreateDisabled?: boolean;
	onSearch?: (query: string) => void;
	onCreate?: () => void;
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
}: Props<T>) {
	const [openModal, setOpenModal] = useState(false);
	const [currentAction, setCurrentAction] = useState<null | Action<T>>(null);
	const [currentItem, setCurrentItem] = useState<null | T>(null);

	const needConfirmation = actions?.some((i) => i.needConfirmation === true);

	// Фильтруем actions для каждого элемента
	const getVisibleActions = (item: T) => {
		return actions?.filter((action) => !action.hidden?.(item)) || [];
	};

	const useColumns: Column<T>[] =
		columns || (headers?.map((key) => ({ key, label: String(key) })) as Column<T>[]) || [];

	return (
		<>
			{needConfirmation && (
				<ConfirmModal
					onConfirm={async () => {
						if (currentAction && currentItem) {
							await currentAction.action(currentItem);
							setTimeout(() => {
								setCurrentAction(null);
								setCurrentItem(null);
							}, 100);
						}
					}}
					actionName={currentAction?.name}
					open={openModal}
					setOpen={setOpenModal}
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
										className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${col.width ? `w-${col.width}` : ''}`}
									>
										{col.label}
									</th>
								))}

								{actions && actions.length > 0 && (
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
								const visibleActions = getVisibleActions(item);

								return (
									<tr
										key={item.id}
										className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
									>
										{useColumns.map((col, colIdx) => {
											const value = item[col.key];
											return (
												<td
													key={colIdx}
													className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
												>
													{col.render ? col.render(value, item) : String(value ?? '')}
												</td>
											);
										})}

										{visibleActions.length > 0 && (
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												<div className="flex justify-end gap-2">
													{visibleActions.map((action, actionIdx) => (
														<button
															key={actionIdx}
															onClick={() => {
																if (!action.needConfirmation) {
																	action.action(item);
																} else {
																	setOpenModal(true);
																	setCurrentItem(item);
																	setCurrentAction(action);
																}
															}}
															className="text-gray-600 cursor-pointer dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
															title={action.name}
														>
															{typeof action.icon === 'string' ? (
																<img className="sr-only" src={action.icon} />
															) : (
																action.icon
															)}
														</button>
													))}
												</div>
											</td>
										)}
									</tr>
								);
							})}
						</tbody>
					</table>
				)}
			</div>
		</>
	);
}
