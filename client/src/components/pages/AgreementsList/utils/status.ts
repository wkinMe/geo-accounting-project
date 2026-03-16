// Функция для получения цвета статуса
export const getStatusColor = (status: string | undefined): string => {
	switch (status) {
		case 'draft':
			return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
		case 'pending':
			return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
		case 'active':
			return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
		case 'in_progress':
			return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
		case 'completed':
			return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
		case 'cancelled':
			return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
		case 'expired':
			return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
		default:
			return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
	}
};

// Функция для перевода статуса
export const getStatusText = (status: string | undefined): string => {
	switch (status) {
		case 'draft':
			return 'Черновик';
		case 'pending':
			return 'Ожидает подтверждения';
		case 'active':
			return 'Активен';
		case 'in_progress':
			return 'В процессе выполнения';
		case 'completed':
			return 'Завершён';
		case 'cancelled':
			return 'Отменён';
		case 'expired':
			return 'Просрочен';
		default:
			return '-';
	}
};
