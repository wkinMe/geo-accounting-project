import { useState, useRef } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { useRole } from '@/hooks/useRole';
import { atLeastManager } from '@/utils';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { useMaterial3DData, useFileUpload, useModelMutations } from './hooks';
import { ModelControls } from './ModelControls';
import { ModelScene } from './ModelScene';
import { DropZone } from './DropZone';
import { ALLOWED_3D_EXTENSIONS } from './utils/fileUtils';

interface Material3DComponentProps {
  materialId: number;
}

export function Material3D({ materialId }: Material3DComponentProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modelDataForPreview, setModelDataForPreview] = useState<any>(null);
  const [previewFormat, setPreviewFormat] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const role = useRole();
  const canEdit = atLeastManager(role);

  const {
    material3D,
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
  } = useFileUpload({
    onFileSelect: (file, format) => {
      if (isEditMode) {
        setModelDataForPreview(file);
        setPreviewFormat(format);
      }
    },
  });

  const handleSuccess = () => {
    setSuccessMessage(
      createMutation.isPending ? '3D объект успешно сохранён' : 
      updateMutation.isPending ? '3D объект успешно обновлён' : 
      '3D объект успешно удалён'
    );
    resetFile();
    setIsEditMode(false);
    setModelDataForPreview(null);
    setPreviewFormat(null);
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

    const formData = new FormData();
    formData.append('material_id', String(materialId));
    formData.append('format', fileFormat || 'unknown');
    formData.append('model_data', selectedFile);

    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedFile) {
      setFileError('Выберите 3D объект для обновления');
      return;
    }

    const formData = new FormData();
    formData.append('material_id', String(materialId));
    formData.append('format', fileFormat || 'unknown');
    formData.append('model_data', selectedFile);

    updateMutation.mutate(formData);
  };

  const handleDeleteConfirm = async () => {
    await deleteMutation.mutateAsync();
    setIsDeleteModalOpen(false);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    resetFile();
    setModelDataForPreview(null);
    setPreviewFormat(null);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    resetFile();
    setModelDataForPreview(null);
    setPreviewFormat(null);
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
  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const viewData = isEditMode && hasNewFile ? selectedFile : serverModelData;
  const viewFormat = isEditMode && hasNewFile ? fileFormat : serverModelFormat;
  const hasDataToView = !!viewData && !!viewFormat;

  const showUploadButton = !hasExistingModel && !hasNewFile && !isEditMode;
  const showSaveButton = hasNewFile && !hasExistingModel;
  const showUpdateButton = hasNewFile && hasExistingModel && isEditMode;
  const showEditButton = hasExistingModel && !isEditMode && canEdit;
  const showDeleteButton = hasExistingModel && !isEditMode && canEdit;
  const showCancelButton = isEditMode && hasExistingModel;

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
          className="flex-1 min-h-[400px] relative bg-white rounded-lg overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <ModelScene modelData={viewData} format={viewFormat} />

          {showUploadButton && (
            <DropZone
              onClick={handleUploadClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          )}

          {isEditMode && !hasNewFile && hasExistingModel && (
            <DropZone
              onClick={handleUploadClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              title="Выберите новую модель для замены"
              hint="Перетащите файл или кликните для выбора"
            />
          )}

          {!showUploadButton && !hasDataToView && !isEditMode && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-400">Нет данных для отображения</p>
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