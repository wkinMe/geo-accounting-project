// client/src/pages/Agreements/components/PartySection/index.tsx
import { useFormContext, Controller } from 'react-hook-form';
import { useEffect } from 'react';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import type { Organization, User, Warehouse } from '@shared/models';
import type { PartyType, AgreementFormValues } from '../../types';
import { useAgreementFormStore } from '../../store';
import {
	useFilteredUsers,
	useOrganizations,
	useUsersByOrganization,
	useWarehousesByOrganization,
} from '@/hooks';
import { type AgreementStatus } from '@shared/constants';

interface PartySectionProps {
	type: PartyType;
	isEditing?: boolean;
	canEdit?: boolean;
	currentStatus?: AgreementStatus;
}

export function PartySection({ type, isEditing = false, canEdit = true }: PartySectionProps) {
	const isSupplier = type === 'supplier';
	const {
		control,
		formState: { errors },
		setValue,
	} = useFormContext<AgreementFormValues>();

	// Получаем состояния из стора
	const {
		[isSupplier ? 'supplierOrg' : 'customerOrg']: orgId,
		[isSupplier ? 'setSupplierOrg' : 'setCustomerOrg']: setOrg,
		[isSupplier ? 'supplierManager' : 'customerManager']: managerId,
		[isSupplier ? 'setSupplierManager' : 'setCustomerManager']: setManager,
		[isSupplier ? 'supplierWarehouse' : 'customerWarehouse']: warehouseId,
		[isSupplier ? 'setSupplierWarehouse' : 'setCustomerWarehouse']: setWarehouse,
		orgSearchQuery,
		[isSupplier ? 'supplierManagerSearchQuery' : 'customerManagerSearchQuery']: managerSearchQuery,
		[isSupplier ? 'supplierWarehouseSearchQuery' : 'customerWarehouseSearchQuery']:
			warehouseSearchQuery,
		setOrgSearchQuery,
		[isSupplier ? 'setSupplierManagerSearchQuery' : 'setCustomerManagerSearchQuery']:
			setManagerSearchQuery,
		[isSupplier ? 'setSupplierWarehouseSearchQuery' : 'setCustomerWarehouseSearchQuery']:
			setWarehouseSearchQuery,
	} = useAgreementFormStore();

	// Запросы
	const { data: organizations, isLoading: isLoadingOrgs } = useOrganizations(orgSearchQuery);
	const { data: users, isLoading: isLoadingUsers } = useUsersByOrganization(
		orgId,
		managerSearchQuery
	);
	const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehousesByOrganization(
		orgId,
		warehouseSearchQuery
	);

	const filteredUsers = useFilteredUsers(users);

	// При изменении организации сбрасываем менеджера и склад
	const handleOrgChange = (id: number | null) => {
		if (!canEdit) return;
		setOrg(id);
		setManager(null);
		setWarehouse(null);
		setValue(isSupplier ? 'supplierManager' : 'customerManager', -1);
		setValue(isSupplier ? 'supplierWarehouse' : 'customerWarehouse', -1);
	};

	const getUserLabel = (user: User) => {
		const roleMap = {
			super_admin: 'Главный администратор',
			admin: 'Администратор',
			manager: 'Менеджер',
			user: 'Пользователь',
		};
		return `${user.name} (${roleMap[user.role]})`;
	};

	const orgField = isSupplier ? 'supplierOrg' : 'customerOrg';
	const managerField = isSupplier ? 'supplierManager' : 'customerManager';
	const warehouseField = isSupplier ? 'supplierWarehouse' : 'customerWarehouse';

	// Синхронизация с формой
	useEffect(() => {
		if (orgId !== null) {
			setValue(orgField, orgId, { shouldValidate: true });
		}
	}, [orgId, orgField, setValue]);

	useEffect(() => {
		if (managerId !== null) {
			setValue(managerField, managerId, { shouldValidate: true });
		}
	}, [managerId, managerField, setValue]);

	useEffect(() => {
		if (warehouseId !== null) {
			setValue(warehouseField, warehouseId, { shouldValidate: true });
		}
	}, [warehouseId, warehouseField, setValue]);

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold">
				{isSupplier ? 'Поставщик' : 'Покупатель'}
				{!canEdit && isEditing && (
					<span className="ml-2 text-sm font-normal text-amber-600 dark:text-amber-400">
						(только просмотр)
					</span>
				)}
			</h2>

			<div className="grid grid-cols-3 gap-4">
				<Controller
					name={orgField}
					control={control}
					render={({ field }) => (
						<SearchableSelect<Organization>
							label="Организация"
							value={orgId}
							onChange={(id) => {
								handleOrgChange(id);
								field.onChange(id);
							}}
							options={organizations || []}
							onSearch={setOrgSearchQuery}
							getOptionLabel={(org) => org.name}
							placeholder="Поиск организации..."
							isLoading={isLoadingOrgs}
							error={errors[orgField]?.message}
							required
							disabled={!canEdit}
						/>
					)}
				/>

				<Controller
					name={warehouseField}
					control={control}
					render={({ field }) => (
						<SearchableSelect<Warehouse>
							label="Склад"
							value={warehouseId}
							onChange={(id) => {
								if (!canEdit) return;
								setWarehouse(id);
								field.onChange(id);
							}}
							options={warehouses || []}
							onSearch={setWarehouseSearchQuery}
							getOptionLabel={(warehouse) => warehouse.name}
							placeholder="Поиск склада..."
							isLoading={isLoadingWarehouses}
							disabled={!orgId || !canEdit}
							error={errors[warehouseField]?.message}
							required
						/>
					)}
				/>

				<Controller
					name={managerField}
					control={control}
					render={({ field }) => (
						<SearchableSelect<User>
							label="Ответственное лицо"
							value={managerId}
							onChange={(id) => {
								if (!canEdit) return;
								setManager(id);
								field.onChange(id);
							}}
							options={filteredUsers}
							onSearch={setManagerSearchQuery}
							getOptionLabel={getUserLabel}
							placeholder="Поиск сотрудника..."
							isLoading={isLoadingUsers}
							disabled={!orgId || !canEdit}
							error={errors[managerField]?.message}
							required
						/>
					)}
				/>
			</div>
		</div>
	);
}
