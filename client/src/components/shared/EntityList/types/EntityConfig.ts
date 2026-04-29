// client/src/components/shared/EntityList/types.ts

import type { Action, Column, HoverPopupConfig } from '../../Table/types';

export interface EntityConfig<T, TableItem = any> {
	entityName: string; // english name for tanstack usage for example
  itemName: string; // русское название для кнопок и тд
	service: {
		findAll: (
			page: number,
			limit: number,
			sortBy?: string,
			sortOrder?: 'ASC' | 'DESC'
		) => Promise<{
			data: T[];
			pagination: { total: number; page: number; limit: number; totalPages: number };
		}>;
		search: (
			query: string,
			page: number,
			limit: number,
			sortBy?: string,
			sortOrder?: 'ASC' | 'DESC'
		) => Promise<{
			data: T[];
			pagination: { total: number; page: number; limit: number; totalPages: number };
		}>;
		delete: (id: number) => Promise<void>;
		create?: (data: any) => Promise<T>;
		update?: (id: number, data: any) => Promise<T>;
	};
	columns: Column<TableItem>[];
	actions?: Action<TableItem>[];
	hoverPopupConfig?: HoverPopupConfig<TableItem>;
	canCreate?: boolean;
	mapToTableItem: (item: T) => TableItem;
	canEdit?: (item: TableItem) => boolean;
	canDelete?: (item: TableItem) => boolean;
	initialSortBy?: string;
	initialSortOrder?: 'ASC' | 'DESC';
	defaultLimit?: number;
	renderModal?: (props: {
		open: boolean;
		setOpen: (open: boolean) => void;
		selectedItem: TableItem | null;
		onSubmit: (data: any) => Promise<void>;
	}) => React.ReactNode;
}
