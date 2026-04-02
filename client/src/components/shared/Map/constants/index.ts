// src/components/shared/Map/constants/index.ts
export const DEFAULT_COORDINATES: [number, number] = [52.4345, 30.95];
export const DEFAULT_ZOOM = 12;

export const MARKER_COLORS = {
	// Организации
	OWN_ORG: '#8B4513',
	OTHER_ORG: '#CD853F',
	// Склады
	OWN_WITH_MANAGER: '#2E7D32',
	OWN_NO_MANAGER: '#66BB6A',
	OTHER_WITH_MANAGER: '#1565C0',
	OTHER_NO_MANAGER: '#42A5F5',
} as const;

export const MARKER_ICONS = {
	warehouse: '🏭',
	organization: '🏢',
};
