import { BaseModel, Point } from "./Base";
import { Warehouse } from "./Warehouse";

export interface Organization extends BaseModel{
  name: string;
  latitude: number;
  longitude: number;
  location: Point;
}

export interface OrganizationWithWarehouses extends Organization {
  warehouses_count?: number;
  warehouses?: Warehouse[];
}

