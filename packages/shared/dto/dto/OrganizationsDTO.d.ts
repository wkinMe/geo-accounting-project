export interface CreateOrganizationDTO {
  name: string;
  latitude: number;
  longitude: number;
}

export interface UpdateOrganizationDTO {
  id: number;
  name?: string;
  latitude?: number;
  longitude?: number;
}
