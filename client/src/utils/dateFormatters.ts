// utils/dateUtils.ts

/**
 * Форматирует дату из ISO строки в формат ДД.ММ.ГГГГ
 * @param dateString - ISO строка даты (например: 2026-03-09T14:09:45.131993)
 * @returns отформатированная дата в формате ДД.ММ.ГГГГ
 */
export const formatDateToDDMMYYYY = (dateString: string): string => {
	if (!dateString) return '';

	const date = new Date(dateString);

	// Проверка на валидность даты
	if (isNaN(date.getTime())) {
		console.error('Invalid date string:', dateString);
		return '';
	}

	const day = date.getDate().toString().padStart(2, '0');
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const year = date.getFullYear();

	return `${day}.${month}.${year}`;
};

/**
 * Возвращает количество дней между двумя датами
 * @param date1 - первая дата
 * @param date2 - вторая дата (по умолчанию текущая дата)
 * @returns количество дней
 */
export const getDaysDifference = (date1: Date, date2: Date = new Date()): number => {
	const diffTime = Math.abs(date2.getTime() - date1.getTime());
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays;
};

/**
 * Возвращает строку с количеством дней назад с правильным окончанием
 * @param dateString - ISO строка даты
 * @returns строка вида "X дней/дня/день назад"
 */
export const getDaysAgoText = (dateString: string): string => {
	if (!dateString) return '';

	const date = new Date(dateString);

	// Проверка на валидность даты
	if (isNaN(date.getTime())) {
		console.error('Invalid date string:', dateString);
		return '';
	}

	const today = new Date();
	const diffDays = getDaysDifference(date, today);

	// Склонение слова "день"
	const getDaysWord = (days: number): string => {
		const lastDigit = days % 10;
		const lastTwoDigits = days % 100;

		if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
			return 'дней';
		}

		if (lastDigit === 1) {
			return 'день';
		}

		if (lastDigit >= 2 && lastDigit <= 4) {
			return 'дня';
		}

		return 'дней';
	};

	return `${diffDays} ${getDaysWord(diffDays)} назад`;
};

/**
 * Комбинированная функция для использования в компоненте
 * @param dateString - ISO строка даты
 * @returns объект с отформатированной датой и текстом "дней назад"
 */
export const getFormattedDateInfo = (dateString: string) => {
	return {
		formattedDate: formatDateToDDMMYYYY(dateString),
		daysAgo: getDaysAgoText(dateString),
	};
};
