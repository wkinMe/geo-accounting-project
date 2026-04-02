import type { BaseModel, Point } from "./Base";
import { Material, type WarehouseMaterial } from "./Material";
import { Organization } from "./Organization";
import { User } from "./User";

export interface Warehouse extends BaseModel {
  name: string;
  organization_id: number;
  manager_id: number;
  latitude: number;
  longitude: number;
  location: Point;
}

export interface WarehouseWithOrganization extends Warehouse {
  organization: Organization;
}

export interface WarehouseWithMaterialsAndOrganization extends WarehouseWithOrganization {
  materials?: WarehouseMaterial[] | null;
  materials_count?: number;
  manager?: User | null;
}
