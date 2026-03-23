// components/modals/WarehouseModal.tsx

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { TextField } from '@/components/shared/Fields';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { userService, organizationService } from '@/services';
import type { CreateWarehouseDTO, UpdateWarehouseDTO } from '@shared/dto';
import { isAdminRole } from '@/utils';
import { useProfileData } from '@/hooks/useProfileData';
import { getManagerFieldAvailable } from './utils';
import type { WarehouseModalData } from './types';
import { USER_ROLES, USER_ROLES_MAP } from '@shared/constants';

const warehouseSchema = z.object({
	name: z.string().min(1, 'Название обязательно'),
	organization_id: z.number().positive('Выберите организацию'),
	manager_id: z.number().optional().nullable(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

interface Props {
	open: boolean;
	setOpen: (open: boolean) => void;
	warehouse?: WarehouseModalData;
	onSubmit: (data: CreateWarehouseDTO | UpdateWarehouseDTO, id?: number) => void | Promise<void>;
	isLoading?: boolean;
}

export function WarehouseModal({ open, setOpen, warehouse, onSubmit }: Props) {
	const queryClient = useQueryClient();
	const [orgSearchQuery, setOrgSearchQuery] = useState('');
	const [managerSearchQuery, setManagerSearchQuery] = useState('');

	const profileData = useProfileData();

	const isEditing = !!warehouse?.id;

	const {
		register,
		reset,
		formState: { errors },
		setValue,
		watch,
		trigger,
	} = useForm<WarehouseFormData>({
		resolver: zodResolver(warehouseSchema),
		defaultValues: {
			name: '',
			organization_id: 0,
			manager_id: null, // Изменено с 0 на null
		},
		mode: 'onChange',
	});

	const { data: currentManagerData, isLoading: isCurrentManagerDataLoading } = useQuery({
		queryKey: ['manager', warehouse?.manager_id],
		queryFn: () => userService.findById(warehouse?.manager_id || 0),
		enabled: !!warehouse?.manager_id && open, // Загружаем только если есть ID и модалка открыта
	});

	// Загружаем все организации для начального отображения
	const { data: organizationsData } = useQuery({
		queryKey: ['organizations'],
		queryFn: () => organizationService.findAll(),
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
		queryKey: ['available-managers', profileData?.role, profileData?.organization_id],
		queryFn: () => {
			const isSuperAdmin = profileData?.role === USER_ROLES.SUPER_ADMIN;
			const orgId = isSuperAdmin ? undefined : profileData?.organization_id;
			return userService.getAvailableManagers(orgId);
		},
		enabled: isAdminRole(profileData?.role),
	});

	// Сброс формы при открытии с новыми данными
	useEffect(() => {
		if (open) {
			// При открытии - заполняем данными склада
			reset({
				name: warehouse?.name ?? '',
				organization_id: warehouse?.organization_id ?? 0,
				manager_id: warehouse?.manager_id ?? null,
			});
			// Сброс поисковых запросов
			setOrgSearchQuery('');
			setManagerSearchQuery('');
		} else {
			// При закрытии - сбрасываем на пустые значения с задержкой
			const timeoutId = setTimeout(() => {
				reset({
					name: '',
					organization_id: 0,
					manager_id: null,
				});
			}, 200);

			return () => clearTimeout(timeoutId);
		}
	}, [open, warehouse, reset]);

	const handleSubmit = async () => {
		// Запуск валидации всех полей формы
		const isValid = await trigger();

		if (isValid) {
			// Получение значений текущих полей формы
			const formData = watch();

			if (isEditing) {
				await onSubmit(formData as UpdateWarehouseDTO, warehouse.id);
			} else {
				await onSubmit(formData as CreateWarehouseDTO);
			}

			// Инвалидация кеша после обновления
			await queryClient.invalidateQueries({ queryKey: ['warehouses'] });
			setOpen(false);
		} else {
			// Проброс ошибки, чтобы модалка не закрылась
			// TODO отображение ошибки
			throw new Error('Пожалуйста, исправьте ошибки в форме');
		}
	};

	const selectedManagerId = watch('manager_id');
	const selectedOrgId = watch('organization_id');

	// Получение организаций для отображения с учётом поиска или его отсутствием
	const organizations =
		orgSearchQuery.length > 0 ? orgSearchData?.data || [] : organizationsData?.data || [];

	const managers = (() => {
		// Базовый список из поиска или доступных менеджеров
		const baseManagers =
			managerSearchQuery.length > 0
				? managerSearchData?.data || []
				: availableManagersData?.data || [];

		// Если есть текущий менеджер и его нет в базовом списке - добавляем его
		if (warehouse?.manager_id && currentManagerData?.data) {
			const managerInList = baseManagers.some((m) => m.id === warehouse.manager_id);
			if (!managerInList) {
				return [currentManagerData.data, ...baseManagers];
			}
		}

		return baseManagers;
	})();

	return (
		<ConfirmModal
			open={open}
			setOpen={setOpen}
			actionName={isEditing ? 'редактирование склада' : 'создание склада'}
			onConfirm={handleSubmit}
			confirmText={isEditing ? 'Сохранить' : 'Создать'}
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
					disabled={!isAdminRole(profileData?.role)}
					onSearch={setOrgSearchQuery}
					isLoading={isOrgSearching}
					getOptionLabel={(org) => org.name}
					placeholder="Поиск организации..."
					error={errors.organization_id?.message}
					required
				/>

				{getManagerFieldAvailable(profileData, warehouse, !isEditing) && (
					<div className="space-y-2">
						<SearchableSelect
							label="Менеджер"
							value={selectedManagerId}
							onChange={(id) => setValue('manager_id', id, { shouldValidate: true })}
							options={managers}
							onSearch={setManagerSearchQuery}
							isLoading={isManagerSearching || isCurrentManagerDataLoading}
							getOptionLabel={(manager) => {
								return `${manager.name} (${USER_ROLES_MAP[manager.role]})`;
							}}
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
				)}
			</div>
		</ConfirmModal>
	);
}
