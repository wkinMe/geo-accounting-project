import { UpdateAgreementDTO } from "../../dto";

export interface AgreementUpdateParams {
  id: number;
  updateData: UpdateAgreementDTO;
  materials?: Array<{
    material_id: number;
    amount: number;
  }>;
}