// components/shared/ConfirmModal.tsx
import { Dialog } from '@base-ui/react';
import { useState } from 'react';
import CloseBtn from '../CloseBtn';

interface Props {
	open: boolean;
	setOpen: (open: boolean) => void;
	actionName?: string;
	children?: React.ReactNode;
	onConfirm?: () => void | Promise<void>;
	onCancel?: () => void;
	confirmText?: string;
	cancelText?: string;
	isDestructive?: boolean;
}

export function ConfirmModal({
	open,
	setOpen,
	actionName,
	children,
	onConfirm,
	onCancel,
	confirmText = 'Подтвердить',
	cancelText = 'Отмена',
	isDestructive = false,
}: Props) {
	const [isLoading, setIsLoading] = useState(false);

	const handleConfirm = async () => {
		if (onConfirm) {
			setIsLoading(true);
			try {
				await onConfirm();
				console.log("SUCCESS");
				setOpen(false);
			} catch (error) {
				console.error('Ошибка при подтверждении:', error);
				// НЕ закрываем модалку при ошибке
			} finally {
				setIsLoading(false);
			}
		} else {
			setOpen(false);
		}
	};

	const handleCancel = () => {
		onCancel?.();
		setOpen(false);
	};

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(isOpen) => {
				// Не даем закрыть модалку через крестик или клик вне, если идет загрузка
				if (!isLoading) {
					setOpen(isOpen);
				}
			}}
		>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-all duration-300 data-closed:opacity-0 data-open:opacity-100 z-1000" />

				<Dialog.Viewport className="fixed inset-0 flex items-center justify-center p-4 z-1000">
					<Dialog.Popup className="relative bg-white dark:bg-black rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800 transition-all duration-300 data-closed:scale-95 data-closed:opacity-0 data-open:scale-100 data-open:opacity-100">
						<Dialog.Close render={<CloseBtn />} className="absolute top-4 right-4" />

						<Dialog.Title className="text-xl font-bold text-black dark:text-white pr-8">
							Подтверждение действия {actionName && `: ${actionName}`}
						</Dialog.Title>

						<div className="mt-4 text-gray-600 dark:text-gray-400">{children}</div>

						<div className="flex justify-between gap-3 mt-6">
							<Dialog.Close
								render={
									<button
										onClick={handleCancel}
										disabled={isLoading}
										className="cursor-pointer px-4 py-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{cancelText}
									</button>
								}
							/>

							<button
								onClick={handleConfirm}
								disabled={isLoading}
								className={`
									px-4 py-2 rounded-lg transition-opacity font-medium
									focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white
									disabled:opacity-50 disabled:cursor-not-allowed
									flex items-center justify-center min-w-25 cursor-pointer
									${
										isDestructive
											? 'bg-red-600 text-white hover:opacity-80 dark:bg-red-700'
											: 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80'
									}
								`}
							>
								{isLoading ? (
									<svg
										className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
								) : (
									confirmText
								)}
							</button>
						</div>
					</Dialog.Popup>
				</Dialog.Viewport>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
