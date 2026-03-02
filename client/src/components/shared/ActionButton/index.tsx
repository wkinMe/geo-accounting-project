import { Button } from '@base-ui/react';

// Это компонент кнопки действия, которая используется в таблицах справа, они содержат только иконку и определённое действие по нажатию. Это может быть переход на какую-нибудь страницу или какой-нибудь запрос на
// бек. Возможно требование подтверждения действия с последующим модальным окном подвтерждения

interface Props {
	name: string; // Название действия
	icon: string | React.ReactNode; // Иконка для кнопки
	iconAlt?: string; // alt тег для icon

	confirmation: boolean; // Нужно ли подтверждение действия
	action: () => void; // Действие выполняемое после нажатия кнопки
}

export function ActionButton({ name, icon, iconAlt, confirmation, action }: Props) {
	const img = typeof icon === 'string' ? <img src={icon} alt={iconAlt} /> : icon;

	return <Button>{img}</Button>;
}
