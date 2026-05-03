// client/src/pages/materials/MaterialModal.tsx
import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { TextField } from '@/components/shared/Fields';
import { DropZone } from '@/components/shared/DropZone';
import { FaImage } from 'react-icons/fa';
import { materialService } from '@/services/materialService';
import type { CreateMaterialDTO, UpdateMaterialDTO } from '@shared/dto';
import { RxCross1 } from 'react-icons/rx';

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
}

export function MaterialModal({ open, setOpen, material, onSubmit }: Props) {
	const queryClient = useQueryClient();
	const isEditing = !!material?.id;
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [removeImage, setRemoveImage] = useState(false);
	const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { data: existingImageBlob } = useQuery({
		queryKey: ['materialImage', material?.id],
		queryFn: () => materialService.getImageBlob(material!.id),
		enabled: isEditing && !!material?.id && open,
	});

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

	useEffect(() => {
		if (existingImageBlob && !imageFile && !removeImage) {
			const url = URL.createObjectURL(existingImageBlob);
			setExistingImageUrl(url);
			return () => {
				URL.revokeObjectURL(url);
			};
		} else {
			setExistingImageUrl(null);
		}
	}, [existingImageBlob, imageFile, removeImage]);

	useEffect(() => {
		if (open) {
			reset({
				name: material?.name ?? '',
				unit: material?.unit ?? '',
			});
			setImageFile(null);
			setImagePreview(null);
			setRemoveImage(false);
			setExistingImageUrl(null);
			setError(null);
		}
	}, [open, material?.id]);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setImageFile(file);
			setRemoveImage(false);
			const preview = URL.createObjectURL(file);
			setImagePreview(preview);
		}
	};

	const handleRemoveImage = () => {
		setImageFile(null);
		setImagePreview(null);
		setRemoveImage(true);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const file = e.dataTransfer.files?.[0];
		if (file && file.type.startsWith('image/')) {
			setImageFile(file);
			setRemoveImage(false);
			const preview = URL.createObjectURL(file);
			setImagePreview(preview);
		}
	};

	const handleClick = () => {
		fileInputRef.current?.click();
	};

	const handleSubmit = async () => {
		setError(null);

		const isValid = await trigger();

		if (!isValid) {
			setError('Пожалуйста, исправьте ошибки в форме');
			throw new Error('Исправьте ошибки в форме');
		}

		const formData = watch();
		const submitData: any = {
			name: formData.name,
			unit: formData.unit,
		};

		if (imageFile) {
			submitData.image = imageFile;
		} else if (removeImage && isEditing) {
			submitData.image = null;
		}

		try {
			if (isEditing) {
				await onSubmit(submitData as UpdateMaterialDTO, material!.id);
			} else {
				await onSubmit(submitData as CreateMaterialDTO);
			}

			await queryClient.invalidateQueries({ queryKey: ['materials'] });
			await queryClient.invalidateQueries({ queryKey: ['materialImage', material?.id] });

			setImageFile(null);
			setImagePreview(null);
			setRemoveImage(false);
			setExistingImageUrl(null);
		} catch (err: any) {
			const errorMessage =
				err?.response?.data?.error || err?.message || 'Произошла ошибка при сохранении';
			setError(errorMessage);
			throw err;
		}
	};

	const displayImage = imagePreview || existingImageUrl;

	return (
		<ConfirmModal
			open={open}
			setOpen={setOpen}
			actionName={isEditing ? 'редактирование материала' : 'создание материала'}
			onConfirm={handleSubmit}
			confirmText={isEditing ? 'Сохранить' : 'Создать'}
			cancelText="Отмена"
			error={error}
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

				<div className="space-y-2">
					<label className="block text-sm font-medium text-gray-700">Изображение</label>

					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleImageChange}
						className="hidden"
					/>

					{displayImage ? (
						<div className="my-4 flex justify-center items-center">
							<div className="relative inline-block">
								<img
									src={displayImage}
									alt="Preview"
									className="w-64 h-64 object-cover rounded-lg border"
								/>
								<button
									type="button"
									onClick={handleRemoveImage}
									className="cursor-pointer absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
								>
									<RxCross1 size={'12'} />
								</button>
							</div>
						</div>
					) : (
						<div className="h-50">
							<DropZone
								onClick={handleClick}
								onDragOver={handleDragOver}
								onDrop={handleDrop}
								title="Загрузить изображение"
								subtitle="Поддерживаемые форматы: JPEG, PNG, GIF, WEBP"
								hint="Перетащите файл или кликните для выбора"
								icon={<FaImage className="text-gray-400 text-4xl mb-3" />}
							/>
						</div>
					)}
				</div>
			</div>
		</ConfirmModal>
	);
}
