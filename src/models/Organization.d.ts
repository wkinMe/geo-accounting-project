import { BaseModel, Point } from "./Base";
import { Warehouse } from "./Warehouse";

export interface Organization extends BaseModel{
  name: string;
  manager_id: number;
  latitude: number;
  longitude: number;
  location: Point;
}

export interface OrganizationWithWarehouses extends Organization {
  warehouses_count?: number;
  warehouses?: Warehouse[];
}

