export interface BaseModel {
  id: number;
  created_at?: Date;
  updated_at?: Date;
}

export type Point = {
  x: number; // longitude
  y: number; // latitude
};
