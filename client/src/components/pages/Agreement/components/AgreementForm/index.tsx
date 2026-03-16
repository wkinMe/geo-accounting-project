// client/src/pages/Agreements/AgreementForm/index.tsx
import { useParams } from 'react-router';
import { FormProvider } from 'react-hook-form';
import { useAgreementForm } from '../../hooks';
import { useProfile } from '@/hooks';
import Spinner from '@/components/shared/Spinner';
import { PartySection } from '../PartySection';
import { MaterialsSection } from '../MaterialsSection';
import { FormActions } from '../FormActions';

export function AgreementForm() {
	const { id } = useParams();
	const agreementId = id ? Number(id) : undefined;

	const { data: _, isLoading: isProfileLoading } = useProfile();
	const { form, store, isLoading, isSubmitting, handleSubmit, error } =
		useAgreementForm(agreementId);

	const handleCancel = () => {
		store.resetForm();
		form.reset();
		window.history.back();
	};

	if (isProfileLoading || isLoading) {
		return <Spinner fullScreen blur />;
	}

	return (
		<FormProvider {...form}>
			<form onSubmit={handleSubmit} className="max-w-7xl mx-auto p-6 space-y-8">
				<h1 className="text-2xl font-bold">
					{agreementId ? 'Редактирование договора' : 'Создание нового договора'}
				</h1>

				{error && (
					<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
						<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
					</div>
				)}

				<PartySection type="supplier" />
				<PartySection type="customer" />
				<MaterialsSection />

				<FormActions
					isEditing={!!agreementId}
					onCancel={handleCancel}
					isSubmitting={isSubmitting}
				/>
			</form>
		</FormProvider>
	);
}
