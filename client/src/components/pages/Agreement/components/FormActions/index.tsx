// client/src/pages/Agreements/components/FormActions/index.tsx
import { Button } from '@/components/shared/Button';

interface FormActionsProps {
	isEditing: boolean;
	onCancel: () => void;
	onSubmit?: () => void;
	isSubmitting?: boolean;
}

export function FormActions({
	isEditing,
	onSubmit,
	onCancel,
	isSubmitting = false,
}: FormActionsProps) {
	return (
		<div className="flex justify-end gap-4 pt-4">
			<Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
				Отмена
			</Button>
			<Button
				variant="primary"
				type="submit"
				onClick={onSubmit}
				loading={isSubmitting}
				disabled={isSubmitting}
			>
				{isEditing ? 'Сохранить' : 'Создать'}
			</Button>
		</div>
	);
}
