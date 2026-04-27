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
import { atLeastAdmin, isAdminRole } from '@/utils';
import { getManagerFieldAvailable } from './utils';
import type { WarehouseModalData } from './types';
import { USER_ROLES, USER_ROLES_MAP } from '@shared/constants';
import { LocationPicker } from '../../../shared/LocationPicker';
import { useProfile } from '@/hooks';

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

	const { data: managerSearchData, isLoading: isManagerSearching } = useQuery({
		queryKey: ['managers', 'search', managerSearchQuery],
		queryFn: () => userService.search(managerSearchQuery),
		enabled: open && managerSearchQuery.length > 0,
	});

	const { data: availableManagersData } = useQuery({
		queryKey: ['available-managers', profileData?.role, profileData?.organization_id],
		queryFn: () => {
			const isSuperAdmin = profileData?.role === USER_ROLES.SUPER_ADMIN;
			const orgId = isSuperAdmin ? undefined : profileData?.organization_id;
			return userService.getAvailableManagers(orgId);
		},
		enabled: isAdminRole(profileData?.role),
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
			// Модалка закроется из ConfirmModal при успехе
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

	const selectedManagerId = watch('manager_id');
	const selectedOrgId = watch('organization_id');

	const organizations = orgSearchQuery.length > 0 ? orgSearchData || [] : organizationsData || [];

	const managers = (() => {
		const baseManagers =
			managerSearchQuery.length > 0 ? managerSearchData || [] : availableManagersData || [];

		if (warehouse?.manager_id && currentManagerData) {
			const managerInList = baseManagers.some((m) => m.id === warehouse.manager_id);
			if (!managerInList) {
				return [currentManagerData, ...baseManagers];
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
								className="w-full rounded-md h-8 bg-red-500 cursor-pointer text-white hover:bg-red-400 transition-colors"
							>
								Снять менеджера
							</button>
						)}
					</div>
				)}

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
