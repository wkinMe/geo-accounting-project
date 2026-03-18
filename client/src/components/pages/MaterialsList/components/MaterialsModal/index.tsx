// client/src/pages/materials/MaterialModal.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { TextField } from '@/components/shared/Fields';
import type { CreateMaterialDTO, UpdateMaterialDTO } from '@shared/dto';

const materialSchema = z.object({
	name: z.string().min(1, 'Название обязательно'),
	unit: z.string().min(1, 'Единица измерения обязательна'),
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface Props {
	open: boolean;
	setOpen: (open: boolean) => void;
	material?: {
		id: number;
		name: string;
		unit: string;
	} | null;
	onSubmit: (data: CreateMaterialDTO | UpdateMaterialDTO, id?: number) => void | Promise<void>;
	isLoading?: boolean;
}

export function MaterialModal({ open, setOpen, material, onSubmit }: Props) {
	const queryClient = useQueryClient();
	const isEditing = !!material?.id;

	const {
		register,
		reset,
		formState: { errors },
		trigger,
		watch,
	} = useForm<MaterialFormData>({
		resolver: zodResolver(materialSchema),
		defaultValues: {
			name: material?.name ?? '',
			unit: material?.unit ?? '',
		},
		mode: 'onChange',
	});

	// Сброс формы при открытии с новыми данными
	useEffect(() => {
		if (open) {
			reset({
				name: material?.name ?? '',
				unit: material?.unit ?? '',
			});
		}
	}, [open, material, reset]);

	const handleSubmit = async () => {
		const isValid = await trigger();

		if (isValid) {
			const formData = watch();

			if (isEditing) {
				await onSubmit(formData as UpdateMaterialDTO, material.id);
			} else {
				await onSubmit(formData as CreateMaterialDTO);
			}

			await queryClient.invalidateQueries({ queryKey: ['materials'] });

			setTimeout(() => {
				setOpen(false);
			}, 150);
		} else {
			throw new Error('Пожалуйста, исправьте ошибки в форме');
		}
	};

	return (
		<ConfirmModal
			open={open}
			setOpen={setOpen}
			actionName={isEditing ? 'редактирование материала' : 'создание материала'}
			onConfirm={handleSubmit}
			confirmText={isEditing ? 'Сохранить' : 'Создать'}
			cancelText="Отмена"
		>
			<div className="space-y-4">
				<TextField
					label="Название материала"
					error={errors.name?.message}
					required
					{...register('name')}
				/>
				<TextField
					label="Единица измерения"
					error={errors.unit?.message}
					required
					{...register('unit')}
					placeholder="шт, кг, л, м и т.д."
				/>
			</div>
		</ConfirmModal>
	);
}
