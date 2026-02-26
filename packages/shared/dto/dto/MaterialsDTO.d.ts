export interface CreateMaterialDTO {
  name: string;
}

export interface UpdateMaterialDTO {
  id: number;
  name: string;
}

export interface CreateWarehouseMaterialDTO {
  warehouse_id: number;
  material_id: number;
  amount: number;
}

export interface UpdateWarehouseMaterialDTO {
  amount?: number;
}

export interface CreateAgreementMaterialDTO {
  agreement_id: number;
  material_id: number;
  amount: number;
}

export interface UpdateAgreementMaterialDTO {
  amount?: number;
}
