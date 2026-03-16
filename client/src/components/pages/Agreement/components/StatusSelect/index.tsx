// client/src/pages/Agreements/components/StatusSelect.tsx
import { useFormContext } from 'react-hook-form';
import { SelectField } from '@/components/shared/Fields';
import type { AgreementFormValues } from '../../types';
import { useAgreementPermissions } from '@/components/pages/AgreementsList/hooks/useAgreementPermissions';
import {
	AGREEMENT_STATUS,
	AGREEMENT_STATUS_LABELS,
	type AgreementStatus,
} from '@shared/constants/agreementStatuses';
import { useEffect } from 'react';

const IRREVERSIBLE_STATUSES = ['active', 'in_progress', 'completed'];

interface StatusSelectProps {
	agreement?: any;
	onStatusChange?: (newStatus: AgreementStatus) => void;
}

export function StatusSelect({ agreement, onStatusChange }: StatusSelectProps) {
	const {
		register,
		formState: { errors },
		watch,
		setValue,
	} = useFormContext<AgreementFormValues>();

	const { canChangeStatus, isStatusLocked, getAvailableStatuses } =
		useAgreementPermissions(agreement);

	const currentStatus = watch('status') as AgreementStatus;

	// Получаем доступные статусы
	const availableStatuses = getAvailableStatuses() as AgreementStatus[];

	const statusOptions = availableStatuses.map((value) => ({
		value,
		label: AGREEMENT_STATUS_LABELS[value],
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
		if (currentStatus && !availableStatuses.includes(currentStatus)) {
			const defaultStatus = availableStatuses[0] || AGREEMENT_STATUS.DRAFT;
			setValue('status', defaultStatus, { shouldValidate: true });
		}
	}, [currentStatus, availableStatuses, setValue]);

	return (
		<div className="space-y-2">
			<SelectField
				label="Статус договора"
				options={statusOptions}
				error={errors.status?.message}
				value={currentStatus}
				onChange={handleChange}
				{...registerRest}
				disabled={isStatusLocked}
				required
			/>

			{isStatusLocked && (
				<p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
					⚠️ Статус завершённого договора может изменить только суперадминистратор
				</p>
			)}

			{agreement && IRREVERSIBLE_STATUSES.includes(agreement.status) && !isStatusLocked && (
				<p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
					ℹ️ После активации договора статус можно только повышать
				</p>
			)}
		</div>
	);
}
