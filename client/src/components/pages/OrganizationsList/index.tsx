// client/src/pages/organizations/OrganizationsList.tsx
import { organizationService } from '@/services/organizationService';
import type { Organization } from '@shared/models';
import { FaRegEye, FaRegTrashAlt } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import type { Action, Column } from '@/components/shared/Table/types';
import { EntityList } from '@/components/shared/EntityList';
import { useRole } from '@/hooks';
import { isSuperAdminRole } from '@/utils';
import { OrganizationModal } from './components';

type TableOrganization = {
	id: number;
	name: string;
	created_at: string;
	latitude?: number | null;
	longitude?: number | null;
};

const columns: Column<TableOrganization>[] = [
	{ key: 'id', label: 'ID' },
	{ key: 'name', label: 'Название' },
	{ key: 'created_at', label: 'Дата создания' },
];

const mapOrganizationToTableItem = (org: Organization): TableOrganization => ({
	id: org.id,
	name: org.name,
	latitude: org.latitude,
	longitude: org.longitude,
	created_at: org.created_at ? new Date(org.created_at).toLocaleDateString('ru-RU') : '',
});

export function OrganizationsList() {
	const role = useRole();
	const canModify = isSuperAdminRole(role);

	const actions: Action<TableOrganization>[] = [
		{
			name: 'Просмотреть',
			action: () => {},
			icon: <FaRegEye />,
		},
		{
			name: 'Редактировать',
			action: () => {},
			icon: <MdEdit />,
		},
		{
			name: 'Удалить',
			action: async () => {},
			icon: <FaRegTrashAlt />,
			needConfirmation: true,
			hidden: () => !canModify,
		},
	];

	return (
		<EntityList
			config={{
				entityName: 'organizations',
				itemName: 'организацию',
				service: {
					findAll: organizationService.findAll.bind(organizationService),
					search: organizationService.search.bind(organizationService),
					delete: organizationService.delete.bind(organizationService),
					create: organizationService.create.bind(organizationService),
					update: organizationService.update.bind(organizationService),
				},
				columns,
				mapToTableItem: mapOrganizationToTableItem,
				actions,
				canCreate: canModify,
				canEdit: () => canModify,
				canDelete: () => canModify,
				initialSortBy: 'id',
				initialSortOrder: 'ASC',
				defaultLimit: 20,
				renderModal: ({ open, setOpen, selectedItem, onSubmit }) => (
					<OrganizationModal
						open={open}
						setOpen={setOpen}
						organization={
							selectedItem
								? {
										id: selectedItem.id,
										name: selectedItem.name,
										latitude: selectedItem.latitude,
										longitude: selectedItem.longitude,
									}
								: null
						}
						onSubmit={onSubmit}
						isLoading={false}
						canEdit={canModify}
					/>
				),
			}}
		/>
	);
}
