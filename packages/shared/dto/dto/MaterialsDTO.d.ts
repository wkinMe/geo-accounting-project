export interface CreateMaterialDTO {
  name: string;
  unit: string;
}

export interface UpdateMaterialDTO {
  id: number;
  name: string;
  unit: string;
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

export interface CreateMaterial3DObjectDTO {
  material_id: number;
  format: string;
  model_data: Buffer;
}

export interface UpdateMaterial3DObjectDTO extends CreateMaterial3DObjectDTO {}
