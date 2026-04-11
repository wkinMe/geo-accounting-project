import type { BaseModel } from "./Base";

export interface Material3D extends BaseModel{
  material_id: number;
  format: string;
  model_data: blob;
  created_at: ArrayBuffer;
}