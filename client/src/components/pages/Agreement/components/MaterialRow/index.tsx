// client/src/pages/Agreements/components/MaterialRow/index.tsx
import { FaTrash } from 'react-icons/fa';
import { NumberField } from '@/components/shared/Fields';
import type { MaterialRow as MaterialRowType } from '../../types';

interface MaterialRowProps {
	material: MaterialRowType;
	onUpdateAmount: (id: string, amount: number) => void;
	onRemove: (id: string) => void;
}

export function MaterialRow({ material, onUpdateAmount, onRemove }: MaterialRowProps) {
	return (
		<tr>
			<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
				{material.name}
			</td>
			<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
				<NumberField
					label=""
					value={material.amount}
					onChange={(newValue) => onUpdateAmount(material.id, newValue)}
					min={1}
					max={material.maxAmount}
					step={0.01}
					required
				/>
			</td>
			<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
				{material.maxAmount}
			</td>
			<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
				<button
					type="button"
					onClick={() => onRemove(material.id)}
					className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
				>
					<FaTrash />
				</button>
			</td>
		</tr>
	);
}
