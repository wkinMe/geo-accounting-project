// client/src/pages/materials/MaterialsList.tsx
import { materialService } from '@/services/materialService';
import type { Material } from '@shared/models';
import { FaRegEye, FaRegTrashAlt } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import type { Action, Column, HoverPopupConfig } from '@/components/shared/Table/types';
import { EntityList } from '@/components/shared/EntityList';
import { useNavigate } from 'react-router';
import { MaterialModal } from './components';
import { MaterialImagePopup } from './components/MaterialsImagePopup';
import { useRole, useProfile } from '@/hooks';
import { isSuperAdminRole, isAdminRole } from '@/utils';

export type TableMaterial = {
	id: number;
	name: string;
	unit: string;
};

const columns: Column<TableMaterial>[] = [
	{ key: 'id', label: 'ID' },
	{ key: 'name', label: 'Название' },
	{ key: 'unit', label: 'Ед. измерения' },
];

const mapMaterialToTableItem = (material: Material): TableMaterial => ({
	id: material.id,
	name: material.name,
	unit: material.unit,
});

export function MaterialsList() {
	const navigate = useNavigate();
	const role = useRole();

	const isSuperAdmin = isSuperAdminRole(role);
	const isAdmin = isAdminRole(role);

	const canEdit = isAdmin || isSuperAdmin;
	const canDelete = isSuperAdmin;
	const canCreate = isAdmin || isSuperAdmin;

	const hoverPopupConfig: HoverPopupConfig<TableMaterial> = {
		delay: 200,
		renderContent: (item) => <MaterialImagePopup materialId={item.id} />,
	};

	const actions: Action<TableMaterial>[] = [
		{
			name: 'Просмотреть',
			action: (item: TableMaterial) => navigate(`${item.id}`),
			icon: <FaRegEye />,
		},
		{
			name: 'Редактировать',
			icon: <MdEdit />,
			hidden: () => !canEdit,
		},
		{
			name: 'Удалить',
			action: async () => {},
			icon: <FaRegTrashAlt />,
			needConfirmation: true,
			hidden: () => !canDelete,
		},
	];

	return (
		<EntityList
			config={{
				entityName: 'materials',
				itemName: 'материал',
				service: {
					findAll: materialService.findAll.bind(materialService),
					search: materialService.search.bind(materialService),
					delete: materialService.delete.bind(materialService),
					create: materialService.create.bind(materialService),
					update: materialService.update.bind(materialService),
				},
				columns,
				mapToTableItem: mapMaterialToTableItem,
				actions,
				hoverPopupConfig,
				canCreate,
				canEdit: () => canEdit,
				canDelete: () => canDelete,
				initialSortBy: 'id',
				initialSortOrder: 'ASC',
				defaultLimit: 20,
				renderModal: ({ open, setOpen, selectedItem, onSubmit }) => (
					<MaterialModal
						open={open}
						setOpen={setOpen}
						material={
							selectedItem
								? {
										id: selectedItem.id,
										name: selectedItem.name,
										unit: selectedItem.unit,
									}
								: null
						}
						onSubmit={onSubmit}
					/>
				),
			}}
		/>
	);
}
