export interface CreateOrganizationDTO {
  name: string;
  manager_id: number;
  latitude: number;
  longitude: number;
}

export interface UpdateOrganizationDTO {
  id: number;
  name?: string;
  manager_id?: number;
  latitude?: number;
  longitude?: number;
}
