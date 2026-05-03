// client/src/pages/Agreements/store/index.ts
import { create } from 'zustand';
import type { AgreementFormState, MaterialRow } from '../types';
import { AGREEMENT_STATUS, type AgreementStatus } from '@shared/constants/agreementStatuses';

const initialState: AgreementFormState = {
	supplierOrg: null,
	supplierManager: null,
	supplierWarehouse: null,
	customerOrg: null,
	customerManager: null,
	customerWarehouse: null,

	orgSearchQuery: '',
	supplierManagerSearchQuery: '',
	customerManagerSearchQuery: '',
	supplierWarehouseSearchQuery: '',
	customerWarehouseSearchQuery: '',
	materialSearchQuery: '',

	materials: [],
	status: AGREEMENT_STATUS.DRAFT,
};

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
	updateItemPrice: (id: string, price: number) => void;
	setStatus: (status: AgreementStatus) => void;
	resetForm: () => void;

	// Метод для проверки изменений
	hasChanges: (
		initialData: {
			supplierOrg: number | null;
			supplierManager: number | null;
			supplierWarehouse: number | null;
			customerOrg: number | null;
			customerManager: number | null;
			customerWarehouse: number | null;
			materials: Array<{
				material_id: number;
				amount: number;
				item_price: number;
			}>;
			status: string;
		} | null
	) => boolean;
};

export const useAgreementFormStore = create<AgreementFormStore>((set, get) => ({
	...initialState,

	setSupplierOrg: (id) => set({ supplierOrg: id, supplierWarehouse: null, supplierManager: null }),
	setSupplierManager: (id) => set({ supplierManager: id }),
	setSupplierWarehouse: (id) => set({ supplierWarehouse: id }),

	setCustomerOrg: (id) => {
		set({ customerOrg: id, customerWarehouse: null, customerManager: null });
	},
	setCustomerManager: (id) => set({ customerManager: id }),
	setCustomerWarehouse: (id) => set({ customerWarehouse: id }),

	setOrgSearchQuery: (query) => set({ orgSearchQuery: query }),
	setSupplierManagerSearchQuery: (query) => set({ supplierManagerSearchQuery: query }),
	setCustomerManagerSearchQuery: (query) => set({ customerManagerSearchQuery: query }),
	setSupplierWarehouseSearchQuery: (query) => set({ supplierWarehouseSearchQuery: query }),
	setCustomerWarehouseSearchQuery: (query) => set({ customerWarehouseSearchQuery: query }),
	setMaterialSearchQuery: (query) => set({ materialSearchQuery: query }),

	addMaterial: (material) =>
		set((state) => ({
			materials: state.materials.some((m) => m.material_id === material.material_id)
				? state.materials
				: [...state.materials, { ...material, id: `${material.material_id}-${Date.now()}` }],
			materialSearchQuery: '',
		})),

	removeMaterial: (id) =>
		set((state) => ({
			materials: state.materials.filter((m) => m.id !== id),
		})),

	updateMaterialAmount: (id, amount) =>
		set((state) => ({
			materials: state.materials.map((m) => (m.id === id ? { ...m, amount } : m)),
		})),

	updateItemPrice: (id, price) =>
		set((state) => ({
			materials: state.materials.map((m) => (m.id === id ? { ...m, item_price: price } : m)),
		})),

	setStatus: (status) => set({ status }),

	resetForm: () => {
		set(initialState);
	},

	hasChanges: (initialData) => {
		if (!initialData) return true;

		const state = get();

		// Сравниваем основные поля
		if (state.supplierOrg !== initialData.supplierOrg) return true;
		if (state.supplierManager !== initialData.supplierManager) return true;
		if (state.supplierWarehouse !== initialData.supplierWarehouse) return true;
		if (state.customerOrg !== initialData.customerOrg) return true;
		if (state.customerManager !== initialData.customerManager) return true;
		if (state.customerWarehouse !== initialData.customerWarehouse) return true;
		if (state.status !== initialData.status) return true;

		// Сравниваем материалы
		if (state.materials.length !== initialData.materials.length) return true;

		for (let i = 0; i < state.materials.length; i++) {
			const current = state.materials[i];
			const initial = initialData.materials.find((m) => m.material_id === current.material_id);

			if (!initial) return true;
			if (current.amount !== initial.amount) return true;
			if (current.item_price !== initial.item_price) return true;
		}

		return false;
	},
}));
