export interface BaseModel {
  id: number;
  created_at: string;
  updated_at: string;
}

export type Point = {
  x: number; // longitude
  y: number; // latitude
};
