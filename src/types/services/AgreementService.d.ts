import { CreateAgreementDTO, UpdateAgreementDTO } from "../../dto";

export interface AgreementCreateParams {
  createData: CreateAgreementDTO;
  materials?: Array<{
    material_id: number;
    amount: number;
  }>;
}

export interface AgreementUpdateParams {
  id: number;
  updateData: UpdateAgreementDTO;
  materials?: Array<{
    material_id: number;
    amount: number;
  }>;
}
