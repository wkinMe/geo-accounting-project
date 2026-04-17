import type { BaseModel } from "./Base";

export interface Material3D extends BaseModel{
  material_id: number;
  format: string;
  model_data: Buffer;
  created_at: string;
  updated_at: string;
}

export interface MaterialImage extends BaseModel {
  material_id: number;
  image_data: Buffer;
}