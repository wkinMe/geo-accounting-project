export interface CreateWarehouseDTO {
  name: string;
  organization_id: number;
  manager_id?: number;
  latitude: number;
  longitude: number;
}

export interface UpdateWarehouseDTO {
  name?: string;
  organization_id?: number;
  manager_id?: number;
  latitude?: number;
  longitude?: number;
}
