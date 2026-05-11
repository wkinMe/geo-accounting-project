// client/src/components/shared/Table/TableRow.tsx
import React, { useState, useRef, useCallback } from 'react';
import type { Action, Column, HoverPopupConfig } from '../../types';
import { HoverPopup } from '@/components/shared/HoverPopup';

interface TableRowProps<T extends { id: number }> {
	item: T;
	columns: Column<T>[];
	visibleActions: Action<T>[];
	onActionClick: (action: Action<T>, item: T) => void;
	hoverPopupConfig?: HoverPopupConfig<T>;
	onRowClick?: (item: T) => void; // Добавляем onRowClick
}

export function TableRow<T extends { id: number }>({
	item,
	columns,
	visibleActions,
	onActionClick,
	hoverPopupConfig,
	onRowClick, // Добавляем
}: TableRowProps<T>) {
	const [popupVisible, setPopupVisible] = useState(false);
	const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
	const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleMouseEnter = useCallback(
		(event: React.MouseEvent<HTMLTableRowElement>) => {
			if (!hoverPopupConfig) return;

			if (hoverTimeoutRef.current) {
				clearTimeout(hoverTimeoutRef.current);
			}

			hoverTimeoutRef.current = setTimeout(() => {
				setPopupPosition({
					x: event.clientX,
					y: event.clientY,
				});
				setPopupVisible(true);
				hoverPopupConfig.onOpen?.(item);
			}, hoverPopupConfig.delay ?? 500);
		},
		[hoverPopupConfig, item]
	);

	const handleMouseLeave = useCallback(() => {
		if (!hoverPopupConfig) return;

		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
			hoverTimeoutRef.current = null;
		}
		setPopupVisible(false);
		hoverPopupConfig.onClose?.(item);
	}, [hoverPopupConfig, item]);

	const handleRowClick = () => {
		if (onRowClick) {
			onRowClick(item);
		}
	};

	// Предотвращаем всплытие клика по кнопкам действий
	const handleActionButtonClick = (e: React.MouseEvent, action: Action<T>) => {
		e.stopPropagation(); // Останавливаем всплытие события
		onActionClick(action, item);
	};

	return (
		<>
			<tr
				className={`hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
					onRowClick ? 'cursor-pointer' : ''
				}`}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onClick={handleRowClick}
			>
				{columns.map((col, colIdx) => {
					const value = item[col.key];
					return (
						<td
							key={colIdx}
							className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${
								col.align === 'right'
									? 'text-right'
									: col.align === 'center'
										? 'text-center'
										: 'text-left'
							}`}
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
									onClick={(e) => handleActionButtonClick(e, action)}
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

			<HoverPopup
				visible={popupVisible}
				position={popupPosition}
				onClose={() => setPopupVisible(false)}
				className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
			>
				{hoverPopupConfig?.renderContent(item)}
			</HoverPopup>
		</>
	);
}
