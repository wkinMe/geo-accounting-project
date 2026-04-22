// client/src/pages/organizations/OrganizationModal.tsx
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { TextField } from '@/components/shared/Fields';
import type { CreateOrganizationDTO, UpdateOrganizationDTO } from '@shared/dto';
import { LocationPicker } from '@/components/shared/LocationPicker';

const organizationSchema = z.object({
	name: z.string().min(1, 'Название обязательно'),
	latitude: z
		.number()
		.min(-90, 'Широта должна быть от -90 до 90')
		.max(90, 'Широта должна быть от -90 до 90')
		.optional()
		.nullable(),
	longitude: z
		.number()
		.min(-180, 'Долгота должна быть от -180 до 180')
		.max(180, 'Долгота должна быть от -180 до 180')
		.optional()
		.nullable(),
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
	const isEditing = !!organization?.id;
	const [error, setError] = useState<string | null>(null);

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
			setError(null);
		}
	}, [open, organization, reset]);

	const handleLocationChange = (lat: number, lng: number) => {
		setLatitude(lat);
		setLongitude(lng);
		setValue('latitude', lat);
		setValue('longitude', lng);
	};

	const handleSubmit = async () => {
		setError(null);

		const isValid = await trigger();

		if (!isValid) {
			setError('Пожалуйста, исправьте ошибки в форме');
			throw new Error('Пожалуйста, исправьте ошибки в форме');
		}

		const formData = watch();
		const submitData: any = {
			name: formData.name,
		};

		if (latitude !== null && longitude !== null) {
			submitData.latitude = latitude;
			submitData.longitude = longitude;
		}

		try {
			if (isEditing) {
				await onSubmit(submitData as UpdateOrganizationDTO, organization!.id);
			} else {
				await onSubmit(submitData as CreateOrganizationDTO);
			}
			// Модалка закроется из ConfirmModal при успехе
		} catch (err: any) {
			const errorMessage =
				err?.response?.data?.error || err?.message || 'Произошла ошибка при сохранении';
			setError(errorMessage);
			throw new Error(errorMessage);
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
				{error && (
					<div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
						❌ {error}
					</div>
				)}

				<TextField
					label="Название организации"
					error={errors.name?.message}
					required
					disabled={!canEdit}
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
