// client/src/pages/Agreements/components/PartySection/index.tsx
import { useFormContext, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
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

interface PartySectionProps {
	type: PartyType;
}

export function PartySection({ type }: PartySectionProps) {
	const isSupplier = type === 'supplier';
	const {
		control,
		formState: { errors },
		setValue,
	} = useFormContext<AgreementFormValues>();

	// Ключи для принудительного обновления компонентов
	const [orgKey, setOrgKey] = useState(0);
	const [managerKey, setManagerKey] = useState(0);
	const [warehouseKey, setWarehouseKey] = useState(0);

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

	// Обновляем ключи при изменении ID
	useEffect(() => {
		setOrgKey((prev) => prev + 1);
	}, [orgId]);

	useEffect(() => {
		setManagerKey((prev) => prev + 1);
	}, [managerId]);

	useEffect(() => {
		setWarehouseKey((prev) => prev + 1);
	}, [warehouseId]);

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
		setOrg(id);
		setManager(null);
		setWarehouse(null);
		setValue(isSupplier ? 'supplierManager' : 'customerManager', undefined);
		setValue(isSupplier ? 'supplierWarehouse' : 'customerWarehouse', undefined);
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
			<h2 className="text-lg font-semibold">{isSupplier ? 'Поставщик' : 'Покупатель'}</h2>
			<div className="grid grid-cols-3 gap-4">
				<Controller
					name={orgField}
					control={control}
					render={({ field }) => (
						<SearchableSelect<Organization>
							key={`org-${orgKey}`}
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
						/>
					)}
				/>

				<Controller
					name={managerField}
					control={control}
					render={({ field }) => (
						<SearchableSelect<User>
							key={`manager-${managerKey}`}
							label="Ответственное лицо"
							value={managerId}
							onChange={(id) => {
								setManager(id);
								field.onChange(id);
							}}
							options={filteredUsers}
							onSearch={setManagerSearchQuery}
							getOptionLabel={getUserLabel}
							placeholder="Поиск сотрудника..."
							isLoading={isLoadingUsers}
							disabled={!orgId}
							error={errors[managerField]?.message}
							required
						/>
					)}
				/>

				<Controller
					name={warehouseField}
					control={control}
					render={({ field }) => (
						<SearchableSelect<Warehouse>
							key={`warehouse-${warehouseKey}`}
							label="Склад"
							value={warehouseId}
							onChange={(id) => {
								setWarehouse(id);
								field.onChange(id);
							}}
							options={warehouses || []}
							onSearch={setWarehouseSearchQuery}
							getOptionLabel={(warehouse) => warehouse.name}
							placeholder="Поиск склада..."
							isLoading={isLoadingWarehouses}
							disabled={!orgId}
							error={errors[warehouseField]?.message}
							required
						/>
					)}
				/>
			</div>
		</div>
	);
}
