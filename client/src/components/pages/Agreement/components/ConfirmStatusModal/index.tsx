// client/src/pages/Agreements/components/ConfirmStatusModal.tsx
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { AGREEMENT_STATUS_LABELS, type AgreementStatus } from '@shared/constants/agreementStatuses';

interface ConfirmStatusModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	oldStatus: AgreementStatus;
	newStatus: AgreementStatus;
	onConfirm: () => void;
	isLoading?: boolean;
}

export function ConfirmStatusModal({  
	open,
	setOpen,
	oldStatus,
	newStatus,
	onConfirm,
}: ConfirmStatusModalProps) {
	const irreversibleStatuses = ['active', 'in_progress', 'completed'];
	const isIrreversible = irreversibleStatuses.includes(newStatus);

	return (
		<ConfirmModal
			open={open}
			setOpen={setOpen}
			actionName="изменение статуса"
			onConfirm={onConfirm}
			confirmText="Подтвердить"
			cancelText="Отмена"
		>
			<div className="space-y-4">
				<p className="text-gray-700 dark:text-gray-300">
					Вы уверены, что хотите изменить статус договора?
				</p>

				<div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
					<div className="flex-1 text-center">
						<div className="text-sm text-gray-500 dark:text-gray-400">Было</div>
						<div className="font-medium text-gray-900 dark:text-gray-100">
							{AGREEMENT_STATUS_LABELS[oldStatus]}
						</div>
					</div>
					<div className="text-gray-400">→</div>
					<div className="flex-1 text-center">
						<div className="text-sm text-gray-500 dark:text-gray-400">Стало</div>
						<div className="font-medium text-gray-900 dark:text-gray-100">
							{AGREEMENT_STATUS_LABELS[newStatus]}
						</div>
					</div>
				</div>

				{isIrreversible && (
					<div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
						<p className="text-sm text-yellow-800 dark:text-yellow-300">
							⚠️ <span className="font-semibold">Внимание!</span> После подтверждения:
						</p>
						<ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-400 list-disc list-inside">
							<li>Материалы будут зарезервированы и списаны со склада</li>
							<li>Статус нельзя будет откатить назад</li>
							<li>Договор перейдёт в активную фазу выполнения</li>
						</ul>
					</div>
				)}
			</div>
		</ConfirmModal>
	);
}
