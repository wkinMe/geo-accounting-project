// client/src/pages/Agreements/components/FormActions/index.tsx
import { Button } from '@/components/shared/Button';
import { useAgreementFormStore } from '../../store';

interface FormActionsProps {
	isEditing: boolean;
	onCancel: () => void;
	onSubmit?: () => void;
	isSubmitting?: boolean;
	initialData?: {
		supplierOrg: number | null;
		supplierManager: number | null;
		supplierWarehouse: number | null;
		customerOrg: number | null;
		customerManager: number | null;
		customerWarehouse: number | null;
		materials: Array<{
			material_id: number;
			amount: number;
			item_price: number;
		}>;
		status: string;
	} | null;
}

export function FormActions({
	isEditing,
	onSubmit,
	onCancel,
	isSubmitting = false,
	initialData,
}: FormActionsProps) {
	const hasChanges = useAgreementFormStore((state) => initialData && state.hasChanges(initialData));

	const isSubmitDisabled = isSubmitting || (isEditing && !hasChanges);

	return (
		<div className="flex justify-end gap-4 pt-4">
			<Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
				Назад
			</Button>
			<Button
				variant="primary"
				type="submit"
				onClick={onSubmit}
				loading={isSubmitting}
				hidden={isSubmitDisabled}
			>
				{isEditing ? 'Сохранить' : 'Создать'}
			</Button>
		</div>
	);
}
