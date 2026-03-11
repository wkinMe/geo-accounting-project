// client/src/pages/users/UserModal.tsx
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { TextField } from '@/components/shared/Fields';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { organizationService } from '@/services';
import type { CreateUserDTO, UpdateUserDTO } from '@shared/dto';
import type { UserRole } from '@shared/models';
import CustomSelect from '@/components/shared/Select';

const userSchema = z.object({
	name: z.string().min(1, 'Имя пользователя обязательно'),
	password: z.string().optional().nullable(),
	role: z.enum(['super_admin', 'admin', 'manager', 'user']),
	organization_id: z.number().optional().nullable(),
});

type UserFormData = z.infer<typeof userSchema>;

interface Props {
	open: boolean;
	setOpen: (open: boolean) => void;
	user?: {
		id: number;
		name: string;
		role: UserRole;
		organization_id?: number | null;
	} | null;
	onSubmit: (data: CreateUserDTO | UpdateUserDTO, id?: number) => void | Promise<void>;
	isLoading?: boolean;
	currentUserRole?: UserRole;
}

export function UserModal({ open, setOpen, user, onSubmit, currentUserRole }: Props) {
	const queryClient = useQueryClient();
	const [orgSearchQuery, setOrgSearchQuery] = useState('');
	const [serverError, setServerError] = useState<string | null>(null);

	const isEditing = !!user?.id;

	const {
		register,
		reset,
		formState: { errors },
		setValue,
		watch,
		trigger,
	} = useForm<UserFormData>({
		resolver: zodResolver(userSchema),
		defaultValues: {
			name: user?.name ?? '',
			password: '',
			role: user?.role ?? 'user',
			organization_id: user?.organization_id ?? null,
		},
		mode: 'onChange',
	});

	const selectedRole = watch('role');
	const selectedOrgId = watch('organization_id');

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

	// Определяем доступные роли для выбора в зависимости от прав текущего пользователя
	const getAvailableRoles = () => {
		const allRoles = [
			{ value: 'user', label: 'Пользователь' },
			{ value: 'manager', label: 'Менеджер' },
			{ value: 'admin', label: 'Администратор' },
			{ value: 'super_admin', label: 'Главный администратор' },
		];

		if (!currentUserRole) return allRoles;

		switch (currentUserRole) {
			case 'super_admin':
				return allRoles;
			case 'admin':
				return allRoles.filter((r) => r.value !== 'super_admin');
			case 'manager':
			case 'user':
				return allRoles.filter((r) => r.value === 'user');
			default:
				return allRoles;
		}
	};

	// Проверка, можно ли редактировать роль
	const canEditRole = () => {
		if (!currentUserRole) return true;
		if (currentUserRole === 'super_admin') return true;
		if (currentUserRole === 'admin' && user?.role !== 'super_admin') return true;
		return false;
	};

	// Сброс формы при открытии с новыми данными
	useEffect(() => {
		if (open) {
			reset({
				name: user?.name ?? '',
				password: '',
				role: user?.role ?? 'user',
				organization_id: user?.organization_id ?? null,
			});
			setOrgSearchQuery('');
			setServerError(null);
		}
	}, [open, user, reset]);

	const handleSubmit = async () => {
		const isValid = await trigger();

		if (isValid) {
			try {
				setServerError(null);

				const formData = watch();

				const data: any = {
					id: user?.id,
					name: formData.name,
					role: formData.role,
				};

				// Добавляем organization_id только если он указан
				if (formData.organization_id) {
					data.organization_id = formData.organization_id;
				}

				// Добавляем пароль только если он указан
				if (formData.password) {
					data.password = formData.password;
				} else if (!isEditing) {
					throw new Error('Пароль обязателен');
				}

				if (isEditing) {
					await onSubmit(data as UpdateUserDTO, user.id);
				} else {
					await onSubmit(data as CreateUserDTO);
				}

				await queryClient.invalidateQueries({ queryKey: ['users'] });
				setOpen(false);
			} catch (error: any) {
				setServerError(error.message || 'Произошла ошибка при сохранении');
				throw error;
			}
		} else {
			throw new Error('Пожалуйста, исправьте ошибки в форме');
		}
	};

	const availableRoles = getAvailableRoles();
	const canEdit = canEditRole();

	// Получаем организации для отображения
	const organizations =
		orgSearchQuery.length > 0 ? orgSearchData?.data || [] : organizationsData?.data || [];

	return (
		<ConfirmModal
			open={open}
			setOpen={setOpen}
			actionName={isEditing ? 'редактирование пользователя' : 'создание пользователя'}
			onConfirm={handleSubmit}
			confirmText={isEditing ? 'Сохранить' : 'Создать'}
			cancelText="Отмена"
		>
			<div className="space-y-4">
				<TextField
					label="Имя пользователя"
					error={errors.name?.message}
					required
					{...register('name')}
				/>

				<TextField
					label={isEditing ? 'Новый пароль (оставьте пустым, если не хотите менять)' : 'Пароль'}
					type="password"
					error={errors.password?.message}
					required={!isEditing}
					{...register('password')}
				/>

				{!isEditing && (
					<p className="text-xs text-gray-500 -mt-2">Минимальная длина пароля: 6 символов</p>
				)}

				{canEdit && (
					<CustomSelect
						label="Роль"
						value={selectedRole}
						onChange={(value) => setValue('role', value as any, { shouldValidate: true })}
						options={availableRoles}
						error={errors.role?.message}
						disabled={!canEdit}
						required
					/>
				)}

				{selectedRole === 'super_admin' && currentUserRole !== 'super_admin' && (
					<p className="text-sm text-amber-600">
						⚠️ Для назначения роли главного администратора требуются права супер-администратора
					</p>
				)}

				<SearchableSelect
					label="Организация"
					value={selectedOrgId}
					onChange={(id) => setValue('organization_id', id ?? null, { shouldValidate: true })}
					options={organizations}
					onSearch={setOrgSearchQuery}
					isLoading={isOrgSearching}
					getOptionLabel={(org) => org.name}
					placeholder="Поиск организации..."
					error={errors.organization_id?.message}
				/>

				{selectedOrgId && (
					<button
						type="button"
						onClick={() => setValue('organization_id', null, { shouldValidate: true })}
						className="w-full rounded-md h-8 bg-red-500 cursor-pointer text-white hover:bg-red-400 transition-colors"
					>
						Очистить организацию
					</button>
				)}

				{serverError && (
					<div className="p-3 bg-red-50 border border-red-200 rounded-md">
						<p className="text-sm text-red-600">{serverError}</p>
					</div>
				)}
			</div>
		</ConfirmModal>
	);
}
