// DTO
export interface CreateAgreementDTO {
  supplier_id: number;
  customer_id: number;
  supplier_warehouse_id: number;
  customer_warehouse_id: number;
  status?: string;
}

export interface UpdateAgreementDTO {
  supplier_id?: number;
  customer_id?: number;
  supplier_warehouse_id?: number;
  customer_warehouse_id?: number;
  status?: string;
}