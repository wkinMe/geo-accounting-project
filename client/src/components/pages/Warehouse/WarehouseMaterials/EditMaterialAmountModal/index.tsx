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
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		if (amount < 0) {
			setError('Количество не может быть отрицательным');
			throw new Error('Количество не может быть отрицательным');
		}

		try {
			await onSubmit(materialId, amount);
			setOpen(false);
			setError(null);
		} catch (err: any) {
			setError(err?.response?.data?.error || err?.message || 'Не удалось обновить количество');
			throw err;
		}
	};

	return (
		<ConfirmModal
			open={open}
			setOpen={setOpen}
			actionName="изменение количества"
			onConfirm={handleSubmit}
			confirmText="Сохранить"
			cancelText="Отмена"
			error={error}
		>
			<div className="space-y-4 py-4">
				<p className="text-gray-900 dark:text-white">
					Материал: <span className="font-medium">{materialName}</span>
				</p>
				<NumberField
					label="Количество"
					value={amount}
					onChange={(val) => {
						setAmount(val);
						setError(null);
					}}
					autoFocus
					required
				/>
			</div>
		</ConfirmModal>
	);
}
