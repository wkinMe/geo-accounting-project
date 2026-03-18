// Новый тип для колонки
export interface Column<T> {
	key: keyof T; // Ключ для доступа к данным
	label: string; // Отображаемый заголовок
	width?: string; // Опциональная ширина
	align?: 'left' | 'center' | 'right';
	render?: (value: any, item: T) => React.ReactNode;
}

export interface Action<T> {
	name: string;
	action: (item: T) => void | Promise<void>;
	icon: string | React.ReactNode;
	needConfirmation?: boolean;
	confirmationBody?: (item: T) => React.ReactNode;
	hidden?: (item: T) => boolean;
}
