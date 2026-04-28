// components/modals/WarehouseModal.tsx
import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { TextField } from '@/components/shared/Fields';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { userService, organizationService } from '@/services';
import type { CreateWarehouseDTO, UpdateWarehouseDTO } from '@shared/dto';
import { atLeastAdmin, isSuperAdminRole } from '@/utils';
import { getManagerFieldAvailable } from './utils';
import type { WarehouseModalData } from './types';
import { USER_ROLES, USER_ROLES_MAP } from '@shared/constants';
import { LocationPicker } from '../../../shared/LocationPicker';
import { useProfile } from '@/hooks';
import type { User } from '@shared/models';

const warehouseSchema = z.object({
	name: z.string().min(1, 'Название обязательно'),
	organization_id: z.number().positive('Выберите организацию'),
	manager_id: z.number().optional().nullable(),
	latitude: z
		.number()
		.min(-90, 'Широта должна быть от -90 до 90')
		.max(90, 'Широта должна быть от -90 до 90'),
	longitude: z
		.number()
		.min(-180, 'Долгота должна быть от -180 до 180')
		.max(180, 'Долгота должна быть от -180 до 180'),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

interface Props {
	open: boolean;
	setOpen: (open: boolean) => void;
	warehouse?: WarehouseModalData;
	onSubmit: (data: CreateWarehouseDTO | UpdateWarehouseDTO, id?: number) => void | Promise<void>;
	isLoading?: boolean;
}

export function WarehouseModal({ open, setOpen, warehouse, onSubmit, isLoading }: Props) {
	const queryClient = useQueryClient();
	const [orgSearchQuery, setOrgSearchQuery] = useState('');
	const [managerSearchQuery, setManagerSearchQuery] = useState('');
	const [latitude, setLatitude] = useState<number | undefined>(warehouse?.latitude ?? undefined);
	const [longitude, setLongitude] = useState<number | undefined>(warehouse?.longitude ?? undefined);
	const [error, setError] = useState<string | null>(null);

	const profileData = useProfile().data;

	const isEditing = !!warehouse?.id;
	const isSuperAdmin = isSuperAdminRole(profileData?.role);
	const canAssignManager = getManagerFieldAvailable(profileData, warehouse, !isEditing);

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
			manager_id: null,
			latitude: 0,
			longitude: 0,
		},
		mode: 'onChange',
	});

	const selectedOrgId = watch('organization_id');
	const selectedManagerId = watch('manager_id');

	const { data: currentManagerData, isLoading: isCurrentManagerDataLoading } = useQuery({
		queryKey: ['manager', warehouse?.manager_id],
		queryFn: () => userService.findById(warehouse?.manager_id || 0),
		enabled: !!warehouse?.manager_id && open,
	});

	const { data: organizationsData } = useQuery({
		queryKey: ['organizations'],
		queryFn: () => organizationService.findAll(),
	});

	const { data: orgSearchData, isLoading: isOrgSearching } = useQuery({
		queryKey: ['organizations', 'search', orgSearchQuery],
		queryFn: () => organizationService.search(orgSearchQuery),
		enabled: open && orgSearchQuery.length > 0,
	});

	// Функция для получения фильтра организации при поиске менеджеров
	const getManagerSearchOrgId = () => {
		if (isSuperAdmin) {
			return undefined;
		}
		return profileData?.organization_id;
	};

	// Поиск менеджеров по запросу
	const { data: managerSearchData, isLoading: isManagerSearching } = useQuery({
		queryKey: ['users', 'search', managerSearchQuery, getManagerSearchOrgId()],
		queryFn: () => userService.search(managerSearchQuery, getManagerSearchOrgId()),
		enabled: open && managerSearchQuery.length > 0,
		retry: false,
	});

	// Для отображения без поиска - загружаем пользователей организации
	const { data: organizationUsers, isLoading: isLoadingOrganizationUsers } = useQuery({
		queryKey: ['users', 'organization', selectedOrgId],
		queryFn: () => userService.findByOrganizationId(selectedOrgId),
		enabled: open && !!selectedOrgId && managerSearchQuery.length === 0,
	});

	useEffect(() => {
		if (open) {
			reset({
				name: warehouse?.name ?? '',
				organization_id: warehouse?.organization_id ?? 0,
				manager_id: warehouse?.manager_id ?? null,
				latitude: warehouse?.latitude,
				longitude: warehouse?.longitude,
			});
			setLatitude(warehouse?.latitude);
			setLongitude(warehouse?.longitude);
			setOrgSearchQuery('');
			setManagerSearchQuery('');
			setError(null);
		} else {
			const timeoutId = setTimeout(() => {
				reset({
					name: '',
					organization_id: 0,
					manager_id: null,
					latitude: undefined,
					longitude: undefined,
				});
			}, 200);

			return () => clearTimeout(timeoutId);
		}
	}, [open, warehouse, reset]);

	const handleSubmit = async () => {
		setError(null);
		const isValid = await trigger();

		if (!isValid) {
			setError('Пожалуйста, исправьте ошибки в форме');
			throw new Error('Пожалуйста, исправьте ошибки в форме');
		}

		const formData = watch();

		try {
			if (isEditing) {
				await onSubmit(formData as UpdateWarehouseDTO, warehouse!.id);
			} else {
				await onSubmit(formData as CreateWarehouseDTO);
			}

			await queryClient.invalidateQueries({ queryKey: ['warehouses'] });
		} catch (err: any) {
			const errorMessage =
				err?.response?.data?.error || err?.message || 'Произошла ошибка при сохранении';
			setError(errorMessage);
			throw err;
		}
	};

	const handleLocationChange = (lat: number, lng: number) => {
		setLatitude(lat);
		setLongitude(lng);
		setValue('latitude', lat, { shouldValidate: true });
		setValue('longitude', lng, { shouldValidate: true });
	};

	const organizations = orgSearchQuery.length > 0 ? orgSearchData || [] : organizationsData || [];

	// Фильтруем пользователей, оставляя только менеджеров, администраторов и супер-администраторов
	const filterManagers = (users: User[]) => {
		if (!users) return [];
		return users.filter(
			(user) =>
				user.role === USER_ROLES.MANAGER ||
				user.role === USER_ROLES.ADMIN ||
				user.role === USER_ROLES.SUPER_ADMIN
		);
	};

	// Формируем список менеджеров для отображения
	const managers = useMemo(() => {
		// Если есть поисковый запрос, используем результаты поиска
		if (managerSearchQuery.length > 0) {
			return filterManagers(managerSearchData || []);
		}

		// Если выбран склад с менеджером, но организация ещё не выбрана
		if (warehouse?.manager_id && currentManagerData) {
			// Показываем текущего менеджера даже если организация не выбрана
			return [currentManagerData];
		}

		// Без поиска показываем пользователей выбранной организации
		if (selectedOrgId && organizationUsers) {
			const filtered = filterManagers(organizationUsers);

			// Если есть текущий менеджер склада, добавляем его в список
			if (warehouse?.manager_id && currentManagerData) {
				const managerInList = filtered.some((m) => m.id === warehouse.manager_id);
				if (!managerInList) {
					return [currentManagerData, ...filtered];
				}
			}
			return filtered;
		}

		return [];
	}, [
		managerSearchQuery,
		managerSearchData,
		selectedOrgId,
		organizationUsers,
		warehouse?.manager_id,
		currentManagerData,
	]);

	const isLoadingManagers =
		(managerSearchQuery.length > 0 && isManagerSearching) ||
		(!managerSearchQuery.length && isLoadingOrganizationUsers) ||
		isCurrentManagerDataLoading;

	return (
		<ConfirmModal
			open={open}
			setOpen={setOpen}
			actionName={isEditing ? 'редактирование склада' : 'создание склада'}
			onConfirm={handleSubmit}
			confirmText={isEditing ? 'Сохранить' : 'Создать'}
			cancelText="Отмена"
			error={error}
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
					disabled={!atLeastAdmin(profileData?.role)}
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
						isLoading={isLoadingManagers}
						getOptionLabel={(manager) => {
							return `${manager.name} (${USER_ROLES_MAP[manager.role]})`;
						}}
						disabled={!canAssignManager}
						placeholder={
							!selectedOrgId && !warehouse?.manager_id
								? 'Сначала выберите организацию'
								: 'Поиск менеджера...'
						}
						error={errors.manager_id?.message}
					/>

					{selectedManagerId && (
						<button
							type="button"
							onClick={() => setValue('manager_id', null, { shouldValidate: true })}
							className="w-full rounded-md h-8 bg-red-500 cursor-pointer text-white hover:bg-red-400 transition-colors"
						>
							Снять менеджера
						</button>
					)}
				</div>

				<LocationPicker
					latitude={latitude}
					longitude={longitude}
					onLocationChange={handleLocationChange}
					height="350px"
					readOnly={!atLeastAdmin(profileData?.role)}
					markerType="warehouse"
					markerColor="#2E7D32"
				/>
			</div>
		</ConfirmModal>
	);
}
