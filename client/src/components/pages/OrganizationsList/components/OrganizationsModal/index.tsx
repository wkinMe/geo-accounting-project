// client/src/pages/organizations/OrganizationModal.tsx
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { TextField } from '@/components/shared/Fields';
import type { CreateOrganizationDTO, UpdateOrganizationDTO } from '@shared/dto';
import { LocationPicker } from '@/components/pages/WarehousesList/WarehouseModal/components/LocationPicker';

const organizationSchema = z.object({
	name: z.string().min(1, 'Название обязательное'),
	latitude: z
		.number()
		.min(-90, 'Широта должна быть от -90 до 90')
		.max(90, 'Широта должна быть от -90 до 90'),
	longitude: z
		.number()
		.min(-180, 'Долгота должна быть от -180 до 180')
		.max(180, 'Долгота должна быть от -180 до 180'),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface Props {
	open: boolean;
	setOpen: (open: boolean) => void;
	organization?: {
		id: number;
		name: string;
		latitude?: number | null;
		longitude?: number | null;
	} | null;
	onSubmit: (
		data: CreateOrganizationDTO | UpdateOrganizationDTO,
		id?: number
	) => void | Promise<void>;
	isLoading?: boolean;
	canEdit?: boolean;
}

export function OrganizationModal({
	open,
	setOpen,
	organization,
	onSubmit,
	canEdit = true,
}: Props) {
	const queryClient = useQueryClient();
	const isEditing = !!organization?.id;

	const [latitude, setLatitude] = useState<number | null>(organization?.latitude ?? null);
	const [longitude, setLongitude] = useState<number | null>(organization?.longitude ?? null);

	const {
		register,
		reset,
		formState: { errors },
		trigger,
		watch,
		setValue,
	} = useForm<OrganizationFormData>({
		resolver: zodResolver(organizationSchema),
		defaultValues: {
			name: organization?.name ?? '',
			latitude: organization?.latitude ?? undefined,
			longitude: organization?.longitude ?? undefined,
		},
		mode: 'onChange',
	});

	useEffect(() => {
		if (open) {
			reset({
				name: organization?.name ?? '',
				latitude: organization?.latitude ?? undefined,
				longitude: organization?.longitude ?? undefined,
			});
			setLatitude(organization?.latitude ?? null);
			setLongitude(organization?.longitude ?? null);
		}
	}, [open, organization, reset]);

	const handleLocationChange = (lat: number, lng: number) => {
		setLatitude(lat);
		setLongitude(lng);
		setValue('latitude', lat, { shouldValidate: true });
		setValue('longitude', lng, { shouldValidate: true });
	};

	const handleSubmit = async () => {
		const isValid = await trigger();

		if (isValid) {
			const formData = watch();

			const submitData = {
				...formData,
				latitude,
				longitude,
			};

			if (isEditing) {
				await onSubmit(submitData as UpdateOrganizationDTO, organization.id);
			} else {
				await onSubmit(submitData as CreateOrganizationDTO);
			}

			await queryClient.invalidateQueries({ queryKey: ['organizations'] });

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

				<LocationPicker
					latitude={latitude}
					longitude={longitude}
					onLocationChange={handleLocationChange}
					height="350px"
					readOnly={!canEdit}
					markerType="organization"
				/>
			</div>
		</ConfirmModal>
	);
}
