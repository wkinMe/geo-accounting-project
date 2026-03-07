// components/modals/EditWarehouseModal.tsx

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { TextField, NumberField } from '@/components/shared/Fields';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { userService, organizationService } from '@/services';
import type { UpdateWarehouseDTO } from '@shared/dto';

const warehouseSchema = z.object({
	name: z.string().min(1, 'Название обязательно'),
	organization_id: z.number().positive('Выберите организацию').nullable(),
	manager_id: z.number().optional().nullable(),
	latitude: z
		.number()
		.min(-90, 'Широта должна быть от -90 до 90')
		.max(90, 'Широта должна быть от -90 до 90')
		.optional(),
	longitude: z
		.number()
		.min(-180, 'Долгота должна быть от -180 до 180')
		.max(180, 'Долгота должна быть от -180 до 180')
		.optional(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

interface Props {
	open: boolean;
	setOpen: (open: boolean) => void;
	warehouse: {
		id: number;
		name: string;
		organization_id: number;
		manager_id?: number | null;
		latitude?: number | null;
		longitude?: number | null;
	};
	onUpdate: (id: number, data: UpdateWarehouseDTO) => void | Promise<void>;
}

export function EditWarehouseModal({ open, setOpen, warehouse, onUpdate }: Props) {
	const queryClient = useQueryClient();
	const [orgSearchQuery, setOrgSearchQuery] = useState('');
	const [managerSearchQuery, setManagerSearchQuery] = useState('');

	const {
		register,
		reset,
		formState: { errors },
		setValue,
		watch,
		trigger, // Добавляем trigger
	} = useForm<WarehouseFormData>({
		resolver: zodResolver(warehouseSchema),
		defaultValues: {
			name: warehouse.name,
			organization_id: warehouse.organization_id,
			manager_id: warehouse.manager_id ?? null,
			latitude: warehouse.latitude ?? undefined,
			longitude: warehouse.longitude ?? undefined,
		},
		mode: 'onSubmit',
	});

	// Загружаем все организации для начального отображения
	const { data: organizationsData } = useQuery({
		queryKey: ['organizations'],
		queryFn: () => organizationService.findAll(),
		enabled: open,
	});

	// Поиск организаций
	const { data: orgSearchData, isLoading: isOrgSearching } = useQuery({
		queryKey: ['organizations', 'search', orgSearchQuery],
		queryFn: () => organizationService.search(orgSearchQuery),
		enabled: open && orgSearchQuery.length > 0,
	});

	// Поиск менеджеров
	const { data: managerSearchData, isLoading: isManagerSearching } = useQuery({
		queryKey: ['managers', 'search', managerSearchQuery],
		queryFn: () => userService.search(managerSearchQuery),
		enabled: open && managerSearchQuery.length > 0,
	});

	// Доступные менеджеры (без поиска)
	const { data: availableManagersData } = useQuery({
		queryKey: ['available-managers'],
		queryFn: () => userService.getAvailableManagers(),
		enabled: open,
	});

	// Сброс формы при открытии с новыми данными
	useEffect(() => {
		if (open) {
			reset({
				name: warehouse.name,
				organization_id: warehouse.organization_id,
				manager_id: warehouse.manager_id ?? null,
				latitude: warehouse.latitude ?? undefined,
				longitude: warehouse.longitude ?? undefined,
			});
			// Сбрасываем поисковые запросы
			setOrgSearchQuery('');
			setManagerSearchQuery('');
		}
	}, [open, warehouse, reset]);

	const onSubmit = async (data: UpdateWarehouseDTO) => {
		await onUpdate(warehouse.id, data);
		// Инвалидируем кэш после обновления
		await queryClient.invalidateQueries({ queryKey: ['warehouses'] });
		setOpen(false); // Закрываем модалку только после успешного обновления
	};

	// Создаем функцию для onConfirm с ручной валидацией
	const handleConfirm = async () => {
		// Запускаем валидацию всех полей
		const isValid = await trigger();

		if (isValid) {
			// Получаем текущие значения формы
			const formData = watch();

			// Фильтруем null значения, оставляем только undefined для опциональных полей
			const data = {
				...formData,
				organization_id: formData.organization_id === null ? undefined : formData.organization_id,
				latitude: formData.latitude === null ? undefined : formData.latitude,
				longitude: formData.longitude === null ? undefined : formData.longitude,
			};

			setTimeout(async () => {
				await onSubmit(data);
			});
		} else {
			// Если есть ошибки валидации, выбрасываем ошибку, чтобы модалка не закрылась
			throw new Error('Пожалуйста, исправьте ошибки в форме');
		}
	};

	const selectedManagerId = watch('manager_id');
	const selectedOrgId = watch('organization_id');

	// Получаем организации для отображения
	const organizations =
		orgSearchQuery.length > 0 ? orgSearchData?.data || [] : organizationsData?.data || [];

	// Получаем менеджеров для отображения
	const managers =
		managerSearchQuery.length > 0
			? managerSearchData?.data || []
			: availableManagersData?.data || [];

	return (
		<ConfirmModal
			open={open}
			setOpen={setOpen}
			actionName="редактирование склада"
			onConfirm={handleConfirm}
			confirmText="Сохранить"
			cancelText="Отмена"
		>
			<div className="space-y-4">
				<TextField
					label="Название склада"
					error={errors.name?.message}
					required
					{...register('name')}
				/>

				<SearchableSelect
					label="Организация"
					value={selectedOrgId}
					onChange={(id) => setValue('organization_id', id ?? 0, { shouldValidate: true })}
					options={organizations}
					onSearch={setOrgSearchQuery}
					isLoading={isOrgSearching}
					getOptionLabel={(org) => org.name}
					placeholder="Поиск организации..."
					error={errors.organization_id?.message}
					required
				/>

				<div className="space-y-2">
					<SearchableSelect
						label="Менеджер"
						value={selectedManagerId}
						onChange={(id) => setValue('manager_id', id, { shouldValidate: true })}
						options={managers}
						onSearch={setManagerSearchQuery}
						isLoading={isManagerSearching}
						getOptionLabel={(manager) =>
							`${manager.name} ${manager.is_admin ? '(Администратор)' : ''}`
						}
						placeholder="Поиск менеджера..."
						error={errors.manager_id?.message}
					/>

					{selectedManagerId && (
						<button
							type="button"
							onClick={() => setValue('manager_id', null, { shouldValidate: true })}
							className="w-full rounded-md h-8 bg-red-500 cursor-pointer text-white hover:bg-red-400 dark:text-red-400 dark:hover:text-red-300 transition-colors"
						>
							Снять менеджера
						</button>
					)}
				</div>

				<div className="grid grid-cols-2 gap-4">
					<NumberField
						label="Широта"
						error={errors.latitude?.message}
						step="any"
						{...register('latitude', {
							setValueAs: (v) => (v === '' ? undefined : Number(v)),
						})}
					/>
					<NumberField
						label="Долгота"
						error={errors.longitude?.message}
						step="any"
						{...register('longitude', {
							setValueAs: (v) => (v === '' ? undefined : Number(v)),
						})}
					/>
				</div>
			</div>
		</ConfirmModal>
	);
}
