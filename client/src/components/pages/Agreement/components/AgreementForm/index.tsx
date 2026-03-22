// client/src/pages/Agreements/AgreementForm/index.tsx
import { useParams } from 'react-router';
import { FormProvider } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import { useAgreementForm } from '../../hooks';
import { useProfile } from '@/hooks';
import Spinner from '@/components/shared/Spinner';
import { PartySection } from '../PartySection';
import { MaterialsSection } from '../MaterialsSection';
import { FormActions } from '../FormActions';
import { StatusSelect } from '../StatusSelect';
import { ConfirmStatusModal } from '../ConfirmStatusModal';
import { IRREVERSIBLE_STATUSES, type AgreementStatus } from '@shared/constants/agreementStatuses';
import type { AgreementFormValues } from '../../types';

export function AgreementForm() {
	const { id } = useParams();
	const agreementId = id ? Number(id) : undefined;

	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const [pendingData, setPendingData] = useState<AgreementFormValues | null>(null);

	const { data: _, isLoading: isProfileLoading } = useProfile();
	const { form, store, isLoading, isSubmitting, error, handleSubmit } =
		useAgreementForm(agreementId);

	const currentStatus = form.watch('status') as AgreementStatus;
	const initialStatus = agreementId ? store.status : null;

	// Проверяем, можно ли редактировать форму
	const canEdit =
		!agreementId ||
		(initialStatus && !IRREVERSIBLE_STATUSES.includes(initialStatus as AgreementStatus));

	// Сброс формы при unmount'e
	useEffect(() => {
		return () => {
			form.reset({
				supplierOrg: undefined,
				supplierManager: undefined,
				supplierWarehouse: undefined,
				customerOrg: undefined,
				customerManager: undefined,
				customerWarehouse: undefined,
				status: 'draft',
				materials: [],
			});
			store.resetForm();
		};
	}, []);

	// Обработчик отправки с подтверждением
	const onSubmit = async (data: AgreementFormValues) => {
		const isChangingToIrreversible =
			initialStatus &&
			!IRREVERSIBLE_STATUSES.includes(initialStatus as AgreementStatus) &&
			IRREVERSIBLE_STATUSES.includes(data.status as AgreementStatus);

		if (isChangingToIrreversible) {
			setPendingData(data);
			setIsConfirmModalOpen(true);
		} else {
			await handleSubmit();
		}
	};

	// Подтверждение отправки
	const confirmSubmit = async () => {
		if (pendingData) {
			Object.entries(pendingData).forEach(([key, value]) => {
				form.setValue(key as any, value);
			});
			await handleSubmit();
			setPendingData(null);
		}
		setIsConfirmModalOpen(false);
	};

	const handleCancel = () => {
		store.resetForm();
		form.reset();
		window.history.back();
	};

	if (isProfileLoading || isLoading) {
		return <Spinner fullScreen blur />;
	}

	return (
		<>
			<FormProvider {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="max-w-7xl mx-auto p-6 space-y-8">
					<h1 className="text-2xl font-bold">
						{agreementId ? 'Редактирование договора' : 'Создание нового договора'}
					</h1>

					{error && (
						<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
							<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
						</div>
					)}

					<PartySection
						type="supplier"
						isEditing={!!agreementId}
						canEdit={canEdit}
						currentStatus={currentStatus}
					/>
					<PartySection
						type="customer"
						isEditing={!!agreementId}
						canEdit={canEdit}
						currentStatus={currentStatus}
					/>

					<div className="max-w-md">
						<StatusSelect
							agreement={agreementId ? store : undefined}
							isEditing={!!agreementId}
							currentStatus={currentStatus}
						/>
					</div>

					<MaterialsSection
						isEditing={!!agreementId}
						canEdit={canEdit}
						currentStatus={currentStatus}
					/>

					<FormActions
						isEditing={!!agreementId}
						onCancel={handleCancel}
						isSubmitting={isSubmitting}
					/>
				</form>
			</FormProvider>

			<ConfirmStatusModal
				open={isConfirmModalOpen}
				setOpen={setIsConfirmModalOpen}
				oldStatus={initialStatus}
				newStatus={pendingData?.status || currentStatus}
				onConfirm={confirmSubmit}
				isLoading={isSubmitting}
			/>
		</>
	);
}
