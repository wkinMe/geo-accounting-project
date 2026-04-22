// client/src/components/Material3D/index.tsx
import { useState, useRef } from 'react';
import { FaSpinner, FaCube } from 'react-icons/fa';
import { useRole } from '@/hooks/useRole';
import { atLeastManager } from '@/utils';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { DropZone } from '@/components/shared/DropZone';
import { useMaterial3DData, useFileUpload, useModelMutations } from './hooks';
import { ModelControls } from './ModelControls';
import { ModelScene } from './ModelScene';
import { ALLOWED_3D_EXTENSIONS } from './utils/fileUtils';

interface Material3DComponentProps {
	materialId: number;
}

export function Material3D({ materialId }: Material3DComponentProps) {
	const [isEditMode, setIsEditMode] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const role = useRole();
	const canEdit = atLeastManager(role);

	const {
		isLoading,
		hasExistingModel,
		modelDataForView: serverModelData,
		modelFormat: serverModelFormat,
	} = useMaterial3DData(materialId);

	const {
		selectedFile,
		modelFormat: fileFormat,
		error: fileError,
		handleFileSelect,
		resetFile,
		setError: setFileError,
	} = useFileUpload();

	const handleSuccess = () => {
		setSuccessMessage(
			createMutation.isPending
				? '3D объект успешно сохранён'
				: updateMutation.isPending
					? '3D объект успешно обновлён'
					: '3D объект успешно удалён'
		);
		resetFile();
		setIsEditMode(false);
		setTimeout(() => setSuccessMessage(null), 3000);
	};

	const { createMutation, updateMutation, deleteMutation } = useModelMutations({
		materialId,
		onSuccess: handleSuccess,
		onError: (err) => {
			setFileError(`Ошибка: ${err?.response?.data?.error || err?.message || 'Неизвестная ошибка'}`);
		},
	});

	const handleSave = () => {
		if (!selectedFile) {
			setFileError('Выберите 3D объект для сохранения');
			return;
		}

		const format = fileFormat || 'unknown';
		createMutation.mutate({ format, file: selectedFile });
	};

	const handleUpdate = () => {
		if (!selectedFile) {
			setFileError('Выберите 3D объект для обновления');
			return;
		}

		const format = fileFormat || 'unknown';
		updateMutation.mutate({ format, file: selectedFile });
	};

	const handleDeleteConfirm = async () => {
		await deleteMutation.mutateAsync();
		setIsDeleteModalOpen(false);
	};

	const handleEditClick = () => {
		setIsEditMode(true);
		resetFile();
	};

	const handleCancelEdit = () => {
		setIsEditMode(false);
		resetFile();
	};

	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			handleFileSelect(file);
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
		if (file) {
			handleFileSelect(file);
		}
	};

	const hasNewFile = !!selectedFile;
	const isPending =
		createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

	// Данные для просмотра: если есть выбранный файл - показываем его, иначе серверные
	const viewData = hasNewFile ? selectedFile : serverModelData;
	const viewFormat = hasNewFile ? fileFormat : serverModelFormat;
	const hasDataToView = !!viewData && !!viewFormat;

	// Логика отображения кнопок
	const showUploadButton = !hasExistingModel && !hasNewFile && !isEditMode && canEdit;
	const showSaveButton = hasNewFile && !hasExistingModel;
	const showUpdateButton = hasNewFile && hasExistingModel && isEditMode;
	const showEditButton = hasExistingModel && !isEditMode && canEdit;
	const showDeleteButton = hasExistingModel && !isEditMode && canEdit;
	const showCancelButton = (isEditMode && hasExistingModel) || (hasNewFile && !hasExistingModel);

	if (isLoading) {
		return (
			<div className="shadow-md flex-1 bg-white rounded-2xl py-4 px-8 flex items-center justify-center">
				<FaSpinner className="animate-spin text-gray-400 text-2xl" />
			</div>
		);
	}

	return (
		<>
			<ConfirmModal
				open={isDeleteModalOpen}
				setOpen={setIsDeleteModalOpen}
				actionName="удаление 3D модели"
				onConfirm={handleDeleteConfirm}
				confirmText="Удалить"
				cancelText="Отмена"
				isDestructive={true}
			>
				<p>Вы действительно хотите удалить 3D модель?</p>
				<p className="text-sm text-gray-500 mt-2">Это действие необратимо.</p>
			</ConfirmModal>

			<div className="shadow-md flex-1 bg-white rounded-2xl py-4 px-8 flex flex-col">
				{fileError && (
					<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
						❌ {fileError}
					</div>
				)}
				{successMessage && (
					<div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
						✅ {successMessage}
					</div>
				)}

				<ModelControls
					showSaveButton={showSaveButton}
					showUpdateButton={showUpdateButton}
					showEditButton={showEditButton}
					showDeleteButton={showDeleteButton}
					showCancelButton={showCancelButton}
					isPending={isPending}
					onSave={handleSave}
					onUpdate={handleUpdate}
					onEdit={handleEditClick}
					onDelete={() => setIsDeleteModalOpen(true)}
					onCancel={handleCancelEdit}
				/>

				<div
					className="flex-1 min-h-100 relative bg-white rounded-lg overflow-hidden"
					onDragOver={handleDragOver}
					onDrop={handleDrop}
				>
					{/* Всегда показываем сцену если есть данные */}
					{hasDataToView && <ModelScene modelData={viewData} format={viewFormat} />}

					{/* Показываем зону загрузки когда нет модели и не выбран файл */}
					{showUploadButton && (
						<DropZone
							onClick={handleUploadClick}
							onDragOver={handleDragOver}
							onDrop={handleDrop}
							title="Загрузить 3D объект"
							subtitle={`Поддерживаемые форматы: ${ALLOWED_3D_EXTENSIONS.join(', ')}`}
							hint="Перетащите файл или кликните для выбора"
							icon={<FaCube className="text-gray-400 text-4xl mb-3" />}
						/>
					)}

					{/* В режиме редактирования и нет выбранного файла - показываем зону для замены */}
					{isEditMode && !hasNewFile && hasExistingModel && (
						<DropZone
							onClick={handleUploadClick}
							onDragOver={handleDragOver}
							onDrop={handleDrop}
							title="Выберите новую модель для замены"
							subtitle={`Поддерживаемые форматы: ${ALLOWED_3D_EXTENSIONS.join(', ')}`}
							hint="Перетащите файл или кликните для выбора"
							icon={<FaCube className="text-gray-400 text-4xl mb-3" />}
						/>
					)}

					{/* Если нет данных, не в режиме загрузки и нет выбранного файла */}
					{!hasDataToView && !showUploadButton && !isEditMode && !hasNewFile && (
						<div className="absolute inset-0 flex flex-col items-center justify-center">
							<FaCube className="text-gray-300 text-6xl mb-4" />
							<p className="text-gray-400">Нет 3D модели для этого материала</p>
							{canEdit && (
								<button
									onClick={handleEditClick}
									className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
								>
									Загрузить 3D модель
								</button>
							)}
						</div>
					)}

					{/* Если выбран файл, но еще не сохранен - показываем превью и сообщение */}
					{hasNewFile && !hasExistingModel && !isPending && (
						<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg shadow-md">
							💡 Файл выбран. Нажмите "Сохранить 3D объект" для загрузки
						</div>
					)}
				</div>

				<input
					ref={fileInputRef}
					type="file"
					accept={ALLOWED_3D_EXTENSIONS.join(',')}
					onChange={handleFileInputChange}
					className="hidden"
				/>
			</div>
		</>
	);
}
