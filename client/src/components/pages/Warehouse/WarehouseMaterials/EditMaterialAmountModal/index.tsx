// client/src/pages/warehouses/EditAmountModal.tsx

import { useState } from 'react';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { NumberField } from '@/components/shared/Fields';

interface Props {
	open: boolean;
	setOpen: (open: boolean) => void;
	materialId: number;
	materialName: string;
	currentAmount: number;
	onSubmit: (materialId: number, amount: number) => Promise<void>;
}

export function EditAmountModal({
	open,
	setOpen,
	materialId,
	materialName,
	currentAmount,
	onSubmit,
}: Props) {
	const [amount, setAmount] = useState(currentAmount);

	const handleSubmit = async () => {
		await onSubmit(materialId, amount);
		setOpen(false);
	};

	return (
		<ConfirmModal
			open={open}
			setOpen={setOpen}
			actionName="изменение количества"
			onConfirm={handleSubmit}
			confirmText="Сохранить"
			cancelText="Отмена"
		>
			<div className="space-y-4 py-4">
				<p className="text-gray-900 dark:text-white">
					Материал: <span className="font-medium">{materialName}</span>
				</p>
				<NumberField
					label="Количество"
					min="0"
					step="1"
					value={amount}
					onChange={(e) => setAmount(Number(e.target.value))}
					autoFocus
					required
				/>
			</div>
		</ConfirmModal>
	);
}
