// client/src/pages/warehouses/RemoveMaterialConfirmModal.tsx

import { ConfirmModal } from '@/components/shared/ConfirmModal';

interface Props {
	open: boolean;
	setOpen: (open: boolean) => void;
	materialName: string;
	currentAmount: number;
	onConfirm: () => Promise<void>;
}

export function RemoveMaterialConfirmModal({
	open,
	setOpen,
	materialName,
	currentAmount,
	onConfirm,
}: Props) {
	return (
		<ConfirmModal
			open={open}
			setOpen={setOpen}
			actionName="удаление материала со склада"
			onConfirm={onConfirm}
			confirmText="Удалить"
			cancelText="Отмена"
		>
			<div className="py-4">
				<p className="text-gray-900 dark:text-white">
					Вы уверены, что хотите удалить материал "{materialName}" со склада?
				</p>
				<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Количество: {currentAmount}</p>
			</div>
		</ConfirmModal>
	);
}
