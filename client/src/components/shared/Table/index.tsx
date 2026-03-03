export type ActionName = 'details' | 'edit' | 'delete' | 'special';

export interface Action<T> {
	name: ActionName;
	action: (item: T) => void;
	icon: string | React.ReactNode;
}

interface Props<T extends { id: number }> {
	headers: readonly (keyof T)[];
	elements: T[];
	actions?: Action<T>[];
}

export function Table<T extends { id: number }>({ headers, elements, actions }: Props<T>) {
	// Если нет данных, показываем пустую таблицу или сообщение
	if (!elements || elements.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500 dark:text-gray-400">
				Нет данных для отображения
			</div>
		);
	}

	return (
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
						<tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
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
												onClick={() => action.action(item)}
												className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
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
	);
}
