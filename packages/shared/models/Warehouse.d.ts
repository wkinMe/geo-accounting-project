import { Material } from "./Material";
import { Organization } from "./Organization";
import { User } from "./User";

export interface Warehouse {
  id: number;
  name: string;
  organization_id: number;
  manager_id: number;
  latitude: number;
  longitude: number;
  location: [number, number];
}

export interface WarehouseWithOrganization extends Warehouse {
  organization: Organization;
}

export interface WarehouseWithMaterialsAndOrganization extends WarehouseWithOrganization {
  materials?: Material[] | null;
  materials_count?: number;
  manager?: User | null;
}

// Или альтернативно, создайте отдельный интерфейс:
export interface WarehouseWithManagerAndOrganization extends WarehouseWithOrganization {
  manager?: User | null;
}