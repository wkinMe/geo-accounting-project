// client/src/pages/Agreements/components/StatusSelect.tsx
import { useFormContext } from 'react-hook-form';
import { SelectField } from '@/components/shared/Fields';
import type { AgreementFormValues } from '../../types';
import { useAgreementStatusPermissions } from '@/components/pages/AgreementsList/hooks/useAgreementStatusPermissions';
import { AGREEMENT_STATUS_LABELS, type AgreementStatus } from '@shared/constants';
import { useEffect } from 'react';

interface StatusSelectProps {
	agreement: any; // Ваш тип AgreementFormState
	isEditing?: boolean;
	currentStatus?: AgreementStatus;
	onStatusChange?: (newStatus: AgreementStatus) => void;
	canEdit?: boolean; // Добавляем пропс для управления редактированием
}

export function StatusSelect({
	agreement,
	currentStatus,
	onStatusChange,
	canEdit = true,
}: StatusSelectProps) {
	const {
		register,
		formState: { errors },
		watch,
		setValue,
	} = useFormContext<AgreementFormValues>();

	// Используем хук для прав на статусы с привязкой к договору
	const { canChangeStatus, getAvailableStatuses, isStatusLocked } =
		useAgreementStatusPermissions(agreement);

	const watchedStatus = watch('status') as AgreementStatus;
	const statusToUse = currentStatus || watchedStatus;

	// Получаем доступные статусы
	const availableStatuses = getAvailableStatuses();

	const statusOptions = availableStatuses.map((value) => ({
		value,
		label: AGREEMENT_STATUS_LABELS[value as AgreementStatus],
		disabled: !canChangeStatus(value),
	}));

	// Синхронизация с формой через register
	const { onChange, ...registerRest } = register('status');

	// Обработчик изменения статуса
	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newStatus = e.target.value as AgreementStatus;

		// Сначала вызываем onChange из register для синхронизации с формой
		onChange(e);

		// Потом вызываем внешний обработчик если есть
		if (onStatusChange) {
			onStatusChange(newStatus);
		}
	};

	// Если текущий статус недоступен - сбрасываем на доступный
	useEffect(() => {
		if (statusToUse && !availableStatuses.includes(statusToUse)) {
			const defaultStatus = availableStatuses[0];
			if (defaultStatus) {
				setValue('status', defaultStatus, { shouldValidate: true });
			}
		}
	}, [statusToUse, availableStatuses, setValue]);

	return (
		<SelectField
			label="Статус договора"
			options={statusOptions}
			error={errors.status?.message}
			value={statusToUse}
			onChange={handleChange}
			disabled={!canEdit || isStatusLocked} // Блокируем если canEdit = false
			{...registerRest}
			required
		/>
	);
}
