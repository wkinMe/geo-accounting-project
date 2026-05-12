// client/src/pages/Agreements/AgreementForm/index.tsx
import { useParams, useLocation, useNavigate } from 'react-router';
import { FormProvider } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useAgreementForm } from '../../hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { agreementService } from '@/services/agreementService';
import Spinner from '@/components/shared/Spinner';
import { Button } from '@/components/shared/Button';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { PartySection } from '../PartySection';
import { MaterialsSection } from '../MaterialsSection';
import { FormActions } from '../FormActions';
import { StatusSelect } from '../StatusSelect';
import { ConfirmStatusModal } from '../ConfirmStatusModal';
import { IRREVERSIBLE_STATUSES, type AgreementStatus } from '@shared/constants/agreementStatuses';
import type { AgreementFormValues } from '../../types';
import { useAgreementBasePermissions } from '@/components/pages/AgreementsList/hooks';
import { useAgreementPermissions } from '../../hooks/useAgreementPermission';
import { AgreementMap } from '../AgreementMap';

interface Props {
	mode?: 'create' | 'edit' | 'view';
}

export function AgreementForm({ mode = 'create' }: Props) {
	const { id } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const agreementId = id ? Number(id) : undefined;

	const isViewMode = mode === 'view';
	const isEditMode = mode === 'edit';
	const isCreateMode = mode === 'create';

	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [pendingData, setPendingData] = useState<AgreementFormValues | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const { form, store, isLoading, isSubmitting, error, handleSubmit, agreementData } =
		useAgreementForm(agreementId);

	const currentStatus = form.watch('status') as AgreementStatus;

	const { canEdit, canDelete } = useAgreementBasePermissions();

	// Проверяем, пришли ли мы из предзаполненного источника
	const isFromPreselected = (location.state as any)?.preserveData === true;

	// Подготовка initialData для FormActions
	const initialData = (() => {
		if (!isEditMode || !agreementData) return null;
		return {
			supplierOrg: agreementData.supplier?.organization_id || null,
			supplierManager: agreementData.supplier?.id || null,
			supplierWarehouse: agreementData.supplier_warehouse_id || null,
			customerOrg: agreementData.customer?.organization_id || null,
			customerManager: agreementData.customer?.id || null,
			customerWarehouse: agreementData.customer_warehouse_id || null,
			materials:
				agreementData.materials?.map((item) => ({
					material_id: item.material.id,
					amount: item.amount,
					item_price: item.item_price,
				})) || [],
			status: agreementData.status,
		};
	})();

	const { canEdit: canEditAgreement, canEditPartyAndMaterials } = useAgreementPermissions({
		isViewMode,
		isCreateMode,
		initialStatus: initialData?.status,
	});

	// Мутация для удаления договора
	const { mutateAsync: deleteMutate, isPending: isDeleting } = useMutation({
		mutationFn: async () => {
			if (!agreementId) throw new Error('ID договора не найден');
			return await agreementService.delete(agreementId);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['agreements'] });
			navigate('/agreements');
		},
		onError: (err: any) => {
			setDeleteError(err?.response?.data?.error || err?.message || 'Не удалось удалить договор');
		},
	});

	const handleDelete = async () => {
		await deleteMutate();
		setIsDeleteConfirmOpen(false);
	};

	// Сброс при монтировании формы создания
	useEffect(() => {
		if (!isCreateMode) return;
		if (isFromPreselected) return;

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
		store.setOrgSearchQuery('');
		store.setSupplierManagerSearchQuery('');
		store.setCustomerManagerSearchQuery('');
		store.setSupplierWarehouseSearchQuery('');
		store.setCustomerWarehouseSearchQuery('');
		store.setMaterialSearchQuery('');
	}, [isCreateMode, isFromPreselected]);

	const onSubmit = async (data: AgreementFormValues) => {
		const isChangingToIrreversible =
			initialData?.status &&
			!IRREVERSIBLE_STATUSES.includes(initialData.status as AgreementStatus) &&
			IRREVERSIBLE_STATUSES.includes(data.status as AgreementStatus);

		if (isChangingToIrreversible) {
			setPendingData(data);
			setIsConfirmModalOpen(true);
		} else {
			await handleSubmit();
		}
	};

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

	if (isLoading) {
		return <Spinner fullScreen blur />;
	}

	return (
		<>
			<FormProvider {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="max-w-7xl mx-auto p-6 space-y-8">
					<div className="flex justify-between items-center">
						<h1 className="text-2xl font-bold">
							{isViewMode && (
								<span>
									Договор №{id}
									<span className="ml-2 text-2xl text-amber-600 dark:text-amber-400">
										(просмотр)
									</span>
								</span>
							)}
							{!isViewMode && agreementId && 'Редактирование договора'}
							{!isViewMode && !agreementId && 'Создание нового договора'}
						</h1>

						{/* Кнопки "Изменить" и "Удалить" только в режиме просмотра для супер-админа/админа */}
						{isViewMode && (
							<div className="flex gap-4">
								{canEdit(store.status) && (
									<Button
										variant="secondary"
										onClick={() => navigate(`/agreements/${agreementId}/edit`)}
									>
										Изменить
									</Button>
								)}
								{canDelete(store.status) && (
									<Button onClick={() => setIsDeleteConfirmOpen(true)} disabled={isDeleting}>
										Удалить
									</Button>
								)}
							</div>
						)}
					</div>

					<PartySection
						type="supplier"
						canEdit={!isViewMode && canEditPartyAndMaterials}
						isViewMode={isViewMode}
					/>
					<PartySection
						type="customer"
						canEdit={!isViewMode && canEditPartyAndMaterials}
						isViewMode={isViewMode}
					/>

					<div className="max-w-md">
						<StatusSelect
							canEdit={!isViewMode}
							agreement={agreementId ? store : undefined}
							currentStatus={currentStatus}
						/>
					</div>

					<div className="mt-8">
						<AgreementMap
							supplierWarehouseId={store.supplierWarehouse}
							customerWarehouseId={store.customerWarehouse}
							onSupplierSelect={(warehouse) => {
								store.setSupplierOrg(warehouse.organization_id);
								store.setSupplierWarehouse(warehouse.id);
								store.setSupplierManager(warehouse.manager_id);
								form.setValue('supplierOrg', warehouse.organization_id);
								form.setValue('supplierWarehouse', warehouse.id);
								form.setValue('supplierManager', warehouse.manager_id);
							}}
							onCustomerSelect={(warehouse) => {
								store.setCustomerOrg(warehouse.organization_id);
								store.setCustomerWarehouse(warehouse.id);
								store.setCustomerManager(warehouse.manager_id);
								form.setValue('customerOrg', warehouse.organization_id);
								form.setValue('customerWarehouse', warehouse.id);
								form.setValue('customerManager', warehouse.manager_id);
							}}
							readOnly={!canEdit(initialData?.status)}
						/>
					</div>

					<MaterialsSection isViewMode={isViewMode} canEdit={canEditAgreement} />

					{error && (
						<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
							<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
						</div>
					)}

					{deleteError && (
						<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
							<p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
						</div>
					)}

					{!isViewMode && (
						<FormActions
							isEditing={isEditMode}
							onCancel={handleCancel}
							isSubmitting={isSubmitting}
							initialData={initialData}
						/>
					)}
				</form>
			</FormProvider>

			<ConfirmStatusModal
				open={isConfirmModalOpen}
				setOpen={setIsConfirmModalOpen}
				oldStatus={initialData?.status}
				newStatus={pendingData?.status || currentStatus}
				onConfirm={confirmSubmit}
				isLoading={isSubmitting}
			/>

			<ConfirmModal
				open={isDeleteConfirmOpen}
				setOpen={setIsDeleteConfirmOpen}
				actionName="удаление договора"
				onConfirm={handleDelete}
				error={deleteError}
			>
				<div className="space-y-2">
					<p>Вы уверены, что хотите удалить договор?</p>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						При удалении договора будут также удалены все связанные записи в истории перемещения
						материалов. Восстановление будет невозможно.
					</p>
				</div>
			</ConfirmModal>
		</>
	);
}
