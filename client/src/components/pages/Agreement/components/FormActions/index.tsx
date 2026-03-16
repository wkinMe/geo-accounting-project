// client/src/pages/Agreements/components/FormActions/index.tsx
import { Button } from '@/components/shared/Button';

interface FormActionsProps {
	isEditing: boolean;
	onCancel: () => void;
	isSubmitting?: boolean;
}

export function FormActions({ isEditing, onCancel, isSubmitting = false }: FormActionsProps) {
	console.log('🔵 FormActions rendered', { isEditing, isSubmitting });

	const handleSubmitClick = (e: React.MouseEvent) => {
		console.log('🟡 Submit button clicked', e);
		// Не вызываем preventDefault, пусть форма обрабатывает
	};

	const handleCancelClick = (e: React.MouseEvent) => {
		console.log('🟡 Cancel button clicked', e);
		onCancel();
	};

	return (
		<div className="flex justify-end gap-4 pt-4">
			<Button variant="secondary" onClick={handleCancelClick} disabled={isSubmitting}>
				Отмена
			</Button>
			<Button
				variant="primary"
				type="submit"
				onClick={handleSubmitClick}
				loading={isSubmitting}
				disabled={isSubmitting}
			>
				{isEditing ? 'Сохранить' : 'Создать'}
			</Button>
		</div>
	);
}
