// shared/dto/material3d.dto.ts
export class CreateMaterial3DDTO {
  materialId: number;
  format: string;
  modelData: Buffer;
}

export class UpdateMaterial3DDTO {
  format?: string;
  modelData?: Buffer;
}
