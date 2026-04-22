import { CreateAgreementDTO, UpdateAgreementDTO } from "@src/dto";

interface AgreementMaterialChangeData {
  material_id: number;
  amount: number;
  item_price: number;
}

export interface AgreementCreateParams {
  createData: CreateAgreementDTO;
  materials?: AgreementMaterialChangeData[];
}

export interface AgreementUpdateParams {
  id: number;
  updateData: UpdateAgreementDTO;
  materials?: AgreementMaterialChangeData[];
}
