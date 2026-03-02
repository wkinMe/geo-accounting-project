import { Dialog } from '@base-ui/react';
import CloseBtn from '../CloseBtn';
import { useState } from 'react';

interface Props {
	open: boolean;
	setOpen: (open: boolean) => void;
	actionName?: string;
	children?: React.ReactNode;
	onConfirm?: () => void | Promise<void>;
	confirmText?: string;
	cancelText?: string;
	isDestructive?: boolean;
}

export function ConfirmedModal({
	open,
	setOpen,
	actionName,
	children,
	onConfirm,
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
				setOpen(false);
			} catch (error) {
				console.error('Ошибка при подтверждении:', error);
			} finally {
				setIsLoading(false);
			}
		} else {
			setOpen(false);
		}
	};

	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-all data-closed:opacity-0 data-open:opacity-100" />

				<Dialog.Viewport className="fixed inset-0 flex items-center justify-center p-4">
					<Dialog.Popup className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 transition-all data-closed:scale-95 data-closed:opacity-0 data-open:scale-100 data-open:opacity-100">
						<Dialog.Close className="absolute top-4 right-4">
							<CloseBtn />
						</Dialog.Close>

						<Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white pr-8">
							Подтверждение действия {actionName && `: ${actionName}`}
						</Dialog.Title>

						{/* Контент модального окна */}
						<div className="mt-4">{children}</div>

						{/* Кнопки действий */}
						<div className="flex justify-end gap-3 mt-6">
							<Dialog.Close>
								<button
									disabled={isLoading}
									className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{cancelText}
								</button>
							</Dialog.Close>

							<button
								onClick={handleConfirm}
								disabled={isLoading}
								className={`
									px-4 py-2 rounded-lg transition-colors font-medium
									focus:outline-none focus:ring-2 focus:ring-offset-2
									disabled:opacity-50 disabled:cursor-not-allowed
									flex items-center justify-center min-w-25
									${
										isDestructive
											? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
											: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
									}
								`}
							>
								{isLoading ? (
									<>
										<svg
											className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
										Загрузка...
									</>
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
