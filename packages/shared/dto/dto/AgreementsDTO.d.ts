import type { AgreementStatus } from "@shared/constants";

// DTO
export interface CreateAgreementDTO {
  supplier_id: number;
  customer_id: number;
  supplier_warehouse_id: number;
  customer_warehouse_id: number;
  status?: AgreementStatus;
}

export interface UpdateAgreementDTO {
  supplier_id?: number;
  customer_id?: number;
  supplier_warehouse_id?: number;
  customer_warehouse_id?: number;
  status?: AgreementStatus;
}