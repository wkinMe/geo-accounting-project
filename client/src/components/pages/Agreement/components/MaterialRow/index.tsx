// client/src/pages/Agreements/components/MaterialRow/index.tsx
import { useState, useRef, useCallback } from 'react';
import { FaTrash } from 'react-icons/fa';
import { NumberField } from '@/components/shared/Fields';
import { useNavigate } from 'react-router';
import { HoverPopup } from '@/components/shared/HoverPopup';
import type { MaterialRow as MaterialRowType } from '../../types';
import { MaterialImagePopup } from '@/components/pages/MaterialsList/components/MaterialsImagePopup';

interface MaterialRowProps {
	material: MaterialRowType;
	canEdit: boolean;
	onUpdateAmount: (id: string, amount: number) => void;
	onUpdatePrice: (id: string, price: number) => void;
	onRemove: (id: string) => void;
}

export function MaterialRow({
	material,
	canEdit,
	onUpdateAmount,
	onUpdatePrice,
	onRemove,
}: MaterialRowProps) {
	const navigate = useNavigate();
	const [popupVisible, setPopupVisible] = useState(false);
	const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
	const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const cellRef = useRef<HTMLTableCellElement>(null);

	const handleMouseEnter = useCallback((event: React.MouseEvent<HTMLTableCellElement>) => {
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
		}

		hoverTimeoutRef.current = setTimeout(() => {
			setPopupPosition({
				x: event.clientX,
				y: event.clientY,
			});
			setPopupVisible(true);
		}, 200);
	}, []);

	const handleMouseLeave = useCallback(() => {
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
			hoverTimeoutRef.current = null;
		}
		setPopupVisible(false);
	}, []);

	const handleClick = () => {
		window.open(`/materials/${material.material_id}`, '_blank');
	};

	return (
		<>
			<tr className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
				<td
					ref={cellRef}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					onClick={handleClick}
					className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
				>
					{material.name}
				</td>
				<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
					{material.maxAmount}
				</td>
				<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
					<NumberField
						label=""
						value={material.amount}
						onChange={(newValue) => onUpdateAmount(material.id, newValue)}
						min={1}
						max={material.maxAmount}
						step={0.01}
						disabled={!canEdit}
					/>
				</td>
				<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
					<NumberField
						label=""
						value={material.item_price}
						onChange={(newValue) => onUpdatePrice(material.id, newValue)}
						min={0}
						max={999_999_999_999}
						step={0.01}
						disabled={!canEdit}
					/>
				</td>
				<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
					<NumberField
						label=""
						value={material.item_price * material.amount}
						onChange={() => null}
						disabled={true}
					/>
				</td>

				{canEdit && (
					<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
						<button
							type="button"
							onClick={() => onRemove(material.id)}
							className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 cursor-pointer transition-colors"
							title="Удалить материал"
						>
							<FaTrash />
						</button>
					</td>
				)}
			</tr>

			<HoverPopup
				visible={popupVisible}
				position={popupPosition}
				onClose={() => setPopupVisible(false)}
				className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
			>
				<MaterialImagePopup materialId={material.material_id} />
			</HoverPopup>
		</>
	);
}
