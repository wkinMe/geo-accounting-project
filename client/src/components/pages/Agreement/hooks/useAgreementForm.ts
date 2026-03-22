// client/src/pages/Agreements/hooks/useAgreementForm.ts
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { agreementService } from '@/services/agreementService';
import type { AgreementCreateParams, AgreementUpdateParams } from '@shared/types';
import { isAxiosError } from '@/types';
import { useAgreementFormStore } from '../store';
import {
	agreementSchema,
	type AgreementFormState,
	type AgreementFormValues,
	type MaterialRow,
} from '../types';
import { warehouseService } from '@/services';
import { AGREEMENT_STATUS } from '@shared/constants/agreementStatuses';

type AgreementFormStore = AgreementFormState & {
	setSupplierOrg: (id: number | null) => void;
	setSupplierManager: (id: number | null) => void;
	setSupplierWarehouse: (id: number | null) => void;
	setCustomerOrg: (id: number | null) => void;
	setCustomerManager: (id: number | null) => void;
	setCustomerWarehouse: (id: number | null) => void;
	setOrgSearchQuery: (query: string) => void;
	setSupplierManagerSearchQuery: (query: string) => void;
	setCustomerManagerSearchQuery: (query: string) => void;
	setSupplierWarehouseSearchQuery: (query: string) => void;
	setCustomerWarehouseSearchQuery: (query: string) => void;
	setMaterialSearchQuery: (query: string) => void;
	addMaterial: (material: Omit<MaterialRow, 'id'>) => void;
	removeMaterial: (id: string) => void;
	updateMaterialAmount: (id: string, amount: number) => void;
	resetForm: () => void;
};

interface UseAgreementFormReturn {
	form: UseFormReturn<AgreementFormValues>;
	store: AgreementFormStore;
	isLoading: boolean;
	isSubmitting: boolean;
	handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
	error: string | null;
}

export function useAgreementForm(agreementId?: number): UseAgreementFormReturn {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const store = useAgreementFormStore();
	const [error, setError] = useState<string | null>(null);
	const isEditing = !!agreementId;

	const { data: agreement, isLoading: isLoadingAgreement } = useQuery({
		queryKey: ['agreement', agreementId],
		queryFn: () => agreementService.findById(agreementId!),
		enabled: isEditing,
		retry: 1,
		staleTime: 0,
	});

	const { data: warehouseMaterials } = useQuery({
		queryKey: ['warehouse-materials', agreement?.data?.supplier_warehouse_id],
		queryFn: () => warehouseService.getMaterials(agreement?.data?.supplier_warehouse_id!),
		enabled: !!agreement?.data?.supplier_warehouse_id,
	});

	const form = useForm<AgreementFormValues>({
		resolver: zodResolver(agreementSchema),
		defaultValues: {
			supplierOrg: undefined,
			supplierManager: undefined,
			supplierWarehouse: undefined,
			customerOrg: undefined,
			customerManager: undefined,
			customerWarehouse: undefined,
			status: AGREEMENT_STATUS.DRAFT,
			materials: [],
		},
		mode: 'onSubmit', // валидация только при отправке
		reValidateMode: 'onChange', // ревалидация при изменении после первой ошибки
	});

	useEffect(() => {
		if (isEditing && agreementId) {
			store.resetForm();
		}
	}, [isEditing, agreementId]);

	// Заполнение формы данными при редактировании
	useEffect(() => {
		if (agreement?.data && isEditing) {
			const data = agreement.data;

			const supplierOrgId = data.supplier?.organization_id || null;
			const customerOrgId = data.customer?.organization_id || null;

			if (supplierOrgId) {
				store.setSupplierOrg(supplierOrgId);
			}
			if (customerOrgId) {
				store.setCustomerOrg(customerOrgId);
			}

			store.setSupplierManager(data.supplier_id);
			store.setCustomerManager(data.customer_id);
			store.setStatus(data.status);

			store.setSupplierWarehouse(data.supplier_warehouse_id);
			store.setCustomerWarehouse(data.customer_warehouse_id);

			if (data.materials && warehouseMaterials?.data) {
				const materialsMap = new Map(warehouseMaterials.data.map((m) => [m.material_id, m.amount]));

				data.materials.forEach((material) => {
					store.addMaterial({
						material_id: material.material.id,
						name: material.material?.name || 'Материал',
						amount: material.amount,
						maxAmount: materialsMap.get(material.material.id) || material.amount,
					});
				});
			}

			if (supplierOrgId && customerOrgId) {
				form.reset({
					supplierOrg: supplierOrgId,
					supplierManager: data.supplier_id,
					customerOrg: customerOrgId,
					customerManager: data.customer_id,
					supplierWarehouse: data.supplier_warehouse_id,
					customerWarehouse: data.customer_warehouse_id,
					materials: store.materials,
					status: store.status,
				});
			}
		}
	}, [agreement, isEditing, form, warehouseMaterials]);

	// Мутация для создания/обновления
	const { mutateAsync, isPending: isSubmitting } = useMutation({
		mutationFn: async (data: AgreementFormValues) => {
			if (isEditing) {
				// Обновление
				const params: AgreementUpdateParams = {
					id: agreementId!,
					updateData: {
						supplier_id: data.supplierManager!,
						customer_id: data.customerManager!,
						supplier_warehouse_id: data.supplierWarehouse!,
						customer_warehouse_id: data.customerWarehouse!,
						status: data.status,
					},
					materials: data.materials.map((m) => ({
						material_id: m.material_id,
						amount: m.amount,
					})),
				};
				return await agreementService.update(params);
			} else {
				// Создание
				const params: AgreementCreateParams = {
					createData: {
						supplier_id: data.supplierManager!,
						customer_id: data.customerManager!,
						supplier_warehouse_id: data.supplierWarehouse!,
						customer_warehouse_id: data.customerWarehouse!,
						status: 'draft',
					},
					materials: data.materials.map((m) => ({
						material_id: m.material_id,
						amount: m.amount,
					})),
				};
				return await agreementService.create(params);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['agreements'] });
			if (isEditing) {
				queryClient.invalidateQueries({ queryKey: ['agreement', agreementId] });
			}

			store.resetForm();
			form.reset();
			setError(null);

			// Перенаправление через setTimeout, чтобы успел сработать useEffect
			setTimeout(() => {
				navigate('/agreements');
			}, 100);
		},
		onError: (err) => {
			if (isAxiosError(err)) {
				// @ts-ignore
				const serverMessage = err.response?.data?.message;
				setError(serverMessage || 'Ошибка при сохранении договора');
			} else {
				setError('Произошла неизвестная ошибка');
			}
		},
	});

	const handleSubmit = form.handleSubmit(async (data) => {
		setError(null);

		await mutateAsync(data);
	});

	// Синхронизация материалов из store в form
	useEffect(() => {
		form.setValue('materials', store.materials, { shouldValidate: true });
	}, [store.materials, form]);

	useEffect(() => {
		form.setValue('status', store.status);
	}, [store.status, form]);

	return {
		form,
		store,
		isLoading: isLoadingAgreement && isEditing,
		isSubmitting,
		handleSubmit,
		error,
	};
}
