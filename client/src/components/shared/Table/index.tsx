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
	confirmationBody?: (item: T) => React.ReactNode; // Функция для кастомного текста подтверждения
}

interface Props<T extends { id: number }> {
	// Для управления закруглением вершин
	roundedT?: boolean;
	roundedB?: boolean;

	headers: readonly (keyof T)[];
	itemName: string; // Название элемента, для которого нужна таблица, по типу склад/отчёт/пользователь и т.д.
	elements: T[];
	actions?: Action<T>[];

	searchValue?: string;
	debounceMs?: number;
	onSearch?: (query: string) => void;

	onCreate?: () => void;
}

export function Table<T extends { id: number }>({
	roundedB = true,
	roundedT = true,

	headers,
	itemName,
	elements,
	actions,

	searchValue,
	debounceMs,
	onSearch,

	onCreate,
}: Props<T>) {
	const [openModal, setOpenModal] = useState(false);
	const [currentAction, setCurrentAction] = useState<null | Action<T>>(null);
	const [currentItem, setCurrentItem] = useState<null | T>(null);

	const needConfirmation = actions?.some((i) => i.needConfirmation === true);

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
				className={`overflow-x-auto ${roundedB && `rounded-b-2xl`} ${roundedT && `rounded-t-2xl`} border border-gray-200 dark:border-gray-800`}
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
					{onCreate && (
						<Button className="cursor-pointer" onClick={onCreate}>
							Добавить {itemName}
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
								{/* Заголовки */}
								{headers.map((header, idx) => (
									<th
										key={idx}
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
									>
										{String(header)}
									</th>
								))}

								{/* Столбец для действий */}
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
							{elements.map((item) => (
								<tr
									key={item.id}
									className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
								>
									{/* Ячейки с данными */}
									{headers.map((header, colIdx) => (
										<td
											key={colIdx}
											className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
										>
											{String(item[header] ?? '')}
										</td>
									))}

									{/* Ячейка с действиями */}
									{actions && actions.length > 0 && (
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											<div className="flex justify-end gap-2">
												{actions.map((action, actionIdx) => (
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
							))}
						</tbody>
					</table>
				)}
			</div>
		</>
	);
}
