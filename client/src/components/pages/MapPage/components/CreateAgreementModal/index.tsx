// src/components/pages/MapPage/components/CreateAgreementModal.tsx
import { useState } from 'react';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

interface CreateAgreementModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	warehouseId: number;
	warehouseName: string;
	onSelect: (warehouseId: number, role: 'supplier' | 'customer') => void;
}

export function CreateAgreementModal({
	open,
	setOpen,
	warehouseId,
	warehouseName,
	onSelect,
}: CreateAgreementModalProps) {
	const [selectedRole, setSelectedRole] = useState<'supplier' | 'customer' | null>(null);

	const handleConfirm = () => {
		if (selectedRole) {
			onSelect(warehouseId, selectedRole);
			setOpen(false);
		}
	};

	return (
		<ConfirmModal
			open={open}
			setOpen={setOpen}
			actionName="составление договора"
			onConfirm={handleConfirm}
			confirmText="Далее"
			cancelText="Отмена"
		>
			<div className="space-y-4">
				<p className="text-gray-600 dark:text-gray-400">
					Выберите роль для склада <span className="font-semibold">{warehouseName}</span>:
				</p>

				<div className="space-y-2">
					<label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
						<input
							type="radio"
							name="role"
							value="supplier"
							checked={selectedRole === 'supplier'}
							onChange={() => setSelectedRole('supplier')}
							className="w-4 h-4"
						/>
						<div>
							<div className="font-medium text-gray-900 dark:text-white">Поставщик</div>
							<div className="text-sm text-gray-500 dark:text-gray-400">
								Склад будет выступать в роли поставщика в договоре
							</div>
						</div>
					</label>

					<label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
						<input
							type="radio"
							name="role"
							value="customer"
							checked={selectedRole === 'customer'}
							onChange={() => setSelectedRole('customer')}
							className="w-4 h-4"
						/>
						<div>
							<div className="font-medium text-gray-900 dark:text-white">Покупатель</div>
							<div className="text-sm text-gray-500 dark:text-gray-400">
								Склад будет выступать в роли покупателя в договоре
							</div>
						</div>
					</label>
				</div>
			</div>
		</ConfirmModal>
	);
}
