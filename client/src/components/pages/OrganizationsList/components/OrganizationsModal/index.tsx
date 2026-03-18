// client/src/pages/organizations/OrganizationModal.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { TextField } from '@/components/shared/Fields';
import type { CreateOrganizationDTO, UpdateOrganizationDTO } from '@shared/dto';

const organizationSchema = z.object({
	name: z.string().min(1, 'Название обязательно'),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface Props {
	open: boolean;
	setOpen: (open: boolean) => void;
	organization?: {
		id: number;
		name: string;
	} | null; // null = режим создания
	onSubmit: (
		data: CreateOrganizationDTO | UpdateOrganizationDTO,
		id?: number
	) => void | Promise<void>;
	isLoading?: boolean;
}

export function OrganizationModal({ open, setOpen, organization, onSubmit }: Props) {
	const queryClient = useQueryClient();
	const isEditing = !!organization?.id;

	const {
		register,
		reset,
		formState: { errors },
		trigger,
		watch,
	} = useForm<OrganizationFormData>({
		resolver: zodResolver(organizationSchema),
		defaultValues: {
			name: organization?.name ?? '',
		},
		mode: 'onChange',
	});

	// Сброс формы при открытии с новыми данными
	useEffect(() => {
		if (open) {
			reset({
				name: organization?.name ?? '',
			});
		}
	}, [open, organization, reset]);

	// client/src/pages/organizations/OrganizationModal.tsx

	const handleSubmit = async () => {
		// Запускаем валидацию всех полей
		const isValid = await trigger();

		if (isValid) {
			// Получаем текущие значения формы
			const formData = watch();

			if (isEditing) {
				await onSubmit(formData as UpdateOrganizationDTO, organization.id);
			} else {
				await onSubmit(formData as CreateOrganizationDTO);
			}

			// Инвалидируем кэш после обновления
			await queryClient.invalidateQueries({ queryKey: ['organizations'] });

			// Небольшая задержка перед закрытием для плавности
			setTimeout(() => {
				setOpen(false);
			}, 150);
		} else {
			// Если есть ошибки валидации, выбрасываем ошибку, чтобы модалка не закрылась
			throw new Error('Пожалуйста, исправьте ошибки в форме');
		}
	};

	return (
		<ConfirmModal
			open={open}
			setOpen={setOpen}
			actionName={isEditing ? 'редактирование организации' : 'создание организации'}
			onConfirm={handleSubmit}
			confirmText={isEditing ? 'Сохранить' : 'Создать'}
			cancelText="Отмена"
		>
			<div className="space-y-4">
				<TextField
					label="Название организации"
					error={errors.name?.message}
					required
					{...register('name')}
				/>
			</div>
		</ConfirmModal>
	);
}
