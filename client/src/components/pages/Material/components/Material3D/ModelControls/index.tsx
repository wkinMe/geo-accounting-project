import { FaSave, FaSpinner, FaEdit, FaTrash } from 'react-icons/fa';

interface ModelControlsProps {
	showSaveButton?: boolean;
	showUpdateButton?: boolean;
	showEditButton?: boolean;
	showDeleteButton?: boolean;
	showCancelButton?: boolean;
	isPending?: boolean;
	onSave?: () => void;
	onUpdate?: () => void;
	onEdit?: () => void;
	onDelete?: () => void;
	onCancel?: () => void;
}

export function ModelControls({
	showSaveButton = false,
	showUpdateButton = false,
	showEditButton = false,
	showDeleteButton = false,
	showCancelButton = false,
	isPending = false,
	onSave,
	onUpdate,
	onEdit,
	onDelete,
	onCancel,
}: ModelControlsProps) {
	return (
		<div className="flex justify-end gap-2 mb-4">
			{showSaveButton && (
				<button
					onClick={onSave}
					disabled={isPending}
					className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isPending ? <FaSpinner className="animate-spin" /> : <FaSave />}
					Сохранить 3D объект
				</button>
			)}

			{showUpdateButton && (
				<button
					onClick={onUpdate}
					disabled={isPending}
					className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isPending ? <FaSpinner className="animate-spin" /> : <FaSave />}
					Обновить 3D объект
				</button>
			)}

			{showEditButton && (
				<button
					onClick={onEdit}
					className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
				>
					<FaEdit />
					Заменить модель
				</button>
			)}

			{showDeleteButton && (
				<button
					onClick={onDelete}
					className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
				>
					<FaTrash />
					Удалить модель
				</button>
			)}

			{showCancelButton && (
				<button
					onClick={onCancel}
					className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
				>
					Отмена
				</button>
			)}
		</div>
	);
}
