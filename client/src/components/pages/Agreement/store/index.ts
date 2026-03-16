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
	status: AGREEMENT_STATUS.DRAFT, // Добавляем статус
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
	setStatus: (status: AgreementStatus) => void; // Добавляем сеттер для статуса
	resetForm: () => void;
};

export const useAgreementFormStore = create<AgreementFormStore>((set) => ({
	...initialState,

	setSupplierOrg: (id) => set({ supplierOrg: id, supplierWarehouse: null, supplierManager: null }),
	setSupplierManager: (id) => set({ supplierManager: id }),
	setSupplierWarehouse: (id) => set({ supplierWarehouse: id }),

	setCustomerOrg: (id) => set({ customerOrg: id, customerWarehouse: null, customerManager: null }),
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

	setStatus: (status) => set({ status }), // Добавляем сеттер

	resetForm: () => set(initialState),
}));
