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
import { USER_ROLES } from '@shared/constants';

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

export function UserModal({ open, setOpen, user, onSubmit, isLoading, currentUserRole }: Props) {
	const queryClient = useQueryClient();
	const [orgSearchQuery, setOrgSearchQuery] = useState('');
	const [error, setError] = useState<string | null>(null);

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
			role: user?.role ?? USER_ROLES.USER,
			organization_id: user?.organization_id ?? null,
		},
		mode: 'onChange',
	});

	const selectedRole = watch('role');
	const selectedOrgId = watch('organization_id');

	const { data: organizations } = useQuery({
		queryKey: ['organizations'],
		queryFn: () => organizationService.findAll(),
	});

	const { data: searchedOrgs, isLoading: isOrgSearching } = useQuery({
		queryKey: ['organizations', 'search', orgSearchQuery],
		queryFn: () => organizationService.search(orgSearchQuery),
		enabled: open && orgSearchQuery.length > 0,
	});

	const getAvailableRoles = () => {
		const allRoles = [
			{ value: USER_ROLES.USER, label: 'Пользователь' },
			{ value: USER_ROLES.MANAGER, label: 'Менеджер' },
			{ value: USER_ROLES.ADMIN, label: 'Администратор' },
			{ value: USER_ROLES.SUPER_ADMIN, label: 'Главный администратор' },
		];

		if (!currentUserRole) return allRoles;

		switch (currentUserRole) {
			case USER_ROLES.SUPER_ADMIN:
				return allRoles;
			case USER_ROLES.ADMIN:
				return allRoles.filter((r) => r.value !== USER_ROLES.SUPER_ADMIN);
			default:
				return allRoles.filter((r) => r.value === USER_ROLES.USER);
		}
	};

	const canEditRole = () => {
		if (!currentUserRole) return true;
		if (currentUserRole === USER_ROLES.SUPER_ADMIN) return true;
		if (currentUserRole === USER_ROLES.ADMIN && user?.role !== USER_ROLES.SUPER_ADMIN) return true;
		return false;
	};

	useEffect(() => {
		if (open) {
			reset({
				name: user?.name ?? '',
				password: '',
				role: user?.role ?? USER_ROLES.USER,
				organization_id: user?.organization_id ?? null,
			});
			setOrgSearchQuery('');
			setError(null);
		}
	}, [open, user, reset]);

	const handleSubmit = async () => {
		setError(null);
		const isValid = await trigger();

		if (!isValid) {
			setError('Пожалуйста, исправьте ошибки в форме');
			throw new Error('Пожалуйста, исправьте ошибки в форме');
		}

		const formData = watch();
		const data: any = {
			name: formData.name,
			role: formData.role,
		};

		if (formData.organization_id) {
			data.organization_id = formData.organization_id;
		}

		if (formData.password) {
			data.password = formData.password;
		} else if (!isEditing) {
			setError('Пароль обязателен');
			throw new Error('Пароль обязателен');
		}

		try {
			if (isEditing) {
				await onSubmit(data as UpdateUserDTO, user!.id);
			} else {
				await onSubmit(data as CreateUserDTO);
			}
			await queryClient.invalidateQueries({ queryKey: ['users'] });
		} catch (err: any) {
			const errorMessage =
				err?.response?.data?.error || err?.message || 'Произошла ошибка при сохранении';
			setError(errorMessage);
			throw err;
		}
	};

	const availableRoles = getAvailableRoles();
	const canEdit = canEditRole();

	const orgList = orgSearchQuery && searchedOrgs ? searchedOrgs : organizations || [];

	return (
		<ConfirmModal
			open={open}
			setOpen={setOpen}
			actionName={isEditing ? 'редактирование пользователя' : 'создание пользователя'}
			onConfirm={handleSubmit}
			confirmText={isEditing ? 'Сохранить' : 'Создать'}
			cancelText="Отмена"
			error={error}
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

				{selectedRole === USER_ROLES.SUPER_ADMIN && currentUserRole !== USER_ROLES.SUPER_ADMIN && (
					<p className="text-sm text-amber-600">
						⚠️ Для назначения роли главного администратора требуются права супер-администратора
					</p>
				)}

				<SearchableSelect
					label="Организация"
					value={selectedOrgId}
					onChange={(id) => setValue('organization_id', id ?? null, { shouldValidate: true })}
					options={orgList}
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
			</div>
		</ConfirmModal>
	);
}
