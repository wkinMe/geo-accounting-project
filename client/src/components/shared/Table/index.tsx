import { useState } from 'react';
import { ConfirmModal } from '../ConfirmModal';

export type ActionName = 'details' | 'edit' | 'delete' | 'special';

export interface Action<T> {
	name: ActionName;
	popupName?: string;
	action: (item: T) => void | Promise<void>;
	icon: string | React.ReactNode;
	needConfirmation?: boolean;
}

interface Props<T extends { id: number }> {
	headers: readonly (keyof T)[];
	itemName: string; // Название элемента, для которого нужна таблица, по типу склад/отчёт/пользователь и т.д.
	elements: T[];
	actions?: Action<T>[];
}

export function Table<T extends { id: number }>({
	headers,
	itemName,
	elements,
	actions,
}: Props<T>) {
	// Если нет данных, показываем пустую таблицу или сообщение
	if (!elements || elements.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500 dark:text-gray-400">
				Нет данных для отображения
			</div>
		);
	}

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
					actionName={currentAction?.popupName}
					open={openModal}
					setOpen={setOpenModal}
				>
					<div className="h-30">
						Вы уверены, что хотите {currentAction?.popupName?.toLocaleLowerCase()}{' '}
						{itemName.toLocaleLowerCase()}?{' '}
					</div>
				</ConfirmModal>
			)}
			<div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
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
														console.log(action);
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
			</div>
		</>
	);
}
