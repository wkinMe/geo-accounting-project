import type { AgreementStatus } from "../constants";

export interface MaterialRow {
	id: string;
	material_id: number;
	name: string;
	amount: number;
	maxAmount?: number;
}

export interface AgreementFormState {
	// Поставщик
	supplierOrg: number | null;
	supplierManager: number | null;
	supplierWarehouse: number | null;

	// Покупатель
	customerOrg: number | null;
	customerManager: number | null;
	customerWarehouse: number | null;

	// Поисковые запросы
	orgSearchQuery: string;
	supplierManagerSearchQuery: string;
	customerManagerSearchQuery: string;
	supplierWarehouseSearchQuery: string;
	customerWarehouseSearchQuery: string;
	materialSearchQuery: string;

	// Материалы
	materials: MaterialRow[];

	status: AgreementStatus
}

export type PartyType = 'supplier' | 'customer';
