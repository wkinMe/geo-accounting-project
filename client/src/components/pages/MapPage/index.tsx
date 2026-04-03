// src/components/pages/MapPage.tsx
import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Map, MARKER_COLORS, type MapMarker } from '@/components/shared/Map';
import { warehouseService } from '@/services/warehouseService';
import { organizationService } from '@/services/organizationService';
import { useProfile } from '@/hooks';
import { atLeastManager } from '@/utils';
import { SearchInput } from '@/components/shared/SearchInput';
import type { Map as LeafletMap } from 'leaflet';

interface SearchResult {
	id: number;
	type: 'organization' | 'warehouse';
	name: string;
	subtitle: string;
	latitude: number;
	longitude: number;
}

export function MapPage() {
	const mapRef = useRef<LeafletMap>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	const profileQuery = useProfile();
	const profile = profileQuery.data?.data;

	const { data: warehousesData, isLoading: isLoadingWarehouses } = useQuery({
		queryKey: ['warehouses'],
		queryFn: () =>
			atLeastManager(profile?.role)
				? warehouseService.findAll()
				: warehouseService.findByOrganizationId(profile?.organization_id || 0),
	});

	const { data: organizationsData, isLoading: isLoadingOrganizations } = useQuery({
		queryKey: ['organizations'],
		queryFn: async () => {
			if (atLeastManager(profile?.role)) {
				return organizationService.findAll();
			} else {
				const singleOrg = await organizationService.findById(profile?.organization_id || 0);
				return { ...singleOrg, data: [singleOrg.data] };
			}
		},
	});

	const isLoading = isLoadingWarehouses || isLoadingOrganizations;
	const currentUserOrgId = profile?.organization_id;

	const handleSearch = useCallback(
		async (query: string) => {
			if (!query.trim()) {
				setSearchResults([]);
				return;
			}

			setIsSearching(true);
			const results: SearchResult[] = [];

			if (organizationsData?.data) {
				const orgResults = organizationsData.data
					.filter((org) => org.name.toLowerCase().includes(query.toLowerCase()))
					.filter((org) => org.latitude && org.longitude)
					.map((org) => ({
						id: org.id,
						type: 'organization' as const,
						name: org.name,
						subtitle: 'Головной офис',
						latitude: org.latitude!,
						longitude: org.longitude!,
					}));
				results.push(...orgResults);
			}

			if (warehousesData?.data) {
				const warehouseResults = warehousesData.data
					.filter((w) => w.name.toLowerCase().includes(query.toLowerCase()))
					.filter((w) => w.latitude && w.longitude)
					.map((warehouse) => ({
						id: warehouse.id,
						type: 'warehouse' as const,
						name: warehouse.name,
						subtitle: warehouse.organization?.name || 'Склад',
						latitude: warehouse.latitude!,
						longitude: warehouse.longitude!,
					}));
				results.push(...warehouseResults);
			}

			setSearchResults(results);
			setIsSearching(false);
		},
		[organizationsData, warehousesData]
	);

	const handleSelectResult = (result: SearchResult) => {
		if (mapRef.current) {
			mapRef.current.setView([result.latitude, result.longitude], 18);
		}
		setSearchQuery('');
		setSearchResults([]);
	};

	const getOrganizationColor = (orgId: number) => {
		return orgId === currentUserOrgId ? MARKER_COLORS.OWN_ORG : MARKER_COLORS.OTHER_ORG;
	};

	const getWarehouseColor = (warehouse: any) => {
		const isOwnOrg = warehouse.organization_id === currentUserOrgId;
		const hasManager = warehouse.manager_id !== null;

		if (isOwnOrg) {
			return hasManager ? MARKER_COLORS.OWN_WITH_MANAGER : MARKER_COLORS.OWN_NO_MANAGER;
		} else {
			return hasManager ? MARKER_COLORS.OTHER_WITH_MANAGER : MARKER_COLORS.OTHER_NO_MANAGER;
		}
	};

	const organizationsMarkers: MapMarker[] =
		organizationsData?.data
			?.filter((o) => o.latitude && o.longitude)
			.map((org) => ({
				id: org.id,
				type: 'organization',
				position: [org.latitude!, org.longitude!],
				iconColor: getOrganizationColor(org.id),
				title: org.name,
				subtitle: 'Головной офис',
			})) || [];

	const warehousesMarkers: MapMarker[] =
		warehousesData?.data
			?.filter((w) => w.latitude && w.longitude)
			.map((warehouse) => ({
				id: warehouse.id,
				type: 'warehouse',
				position: [warehouse.latitude!, warehouse.longitude!],
				iconColor: getWarehouseColor(warehouse),
				title: warehouse.name,
				subtitle: warehouse.organization?.name,
				description: `Менеджер: ${warehouse.manager?.name || 'Не назначен'}`,
			})) || [];

	const allMarkers = [...organizationsMarkers, ...warehousesMarkers];

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[95vh]">
				<div className="text-center text-gray-500">Загрузка карты...</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-[95vh]">
			{/* Строка поиска над картой */}
			<div className="shrink-0 mx-auto bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
				<div className="relative w-3xl">
					<SearchInput
						value={searchQuery}
						ms={300}
						onSearch={handleSearch}
						placeholder="Поиск организаций и складов..."
						className="w-full"
					/>

					{/* Результаты поиска */}
					{searchResults.length > 0 && !isSearching && (
						<div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto z-[1000]">
							{searchResults.map((result) => (
								<button
									key={`${result.type}-${result.id}`}
									onClick={() => handleSelectResult(result)}
									className="cursor-pointer w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
								>
									<div className="flex items-center gap-3">
										<div
											className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
												result.type === 'organization' ? 'bg-amber-600' : 'bg-emerald-600'
											}`}
										>
											{result.type === 'organization' ? '🏢' : '🏭'}
										</div>
										<div className="flex-1">
											<div className="font-medium text-gray-900 dark:text-white">{result.name}</div>
											<div className="text-sm text-gray-500 dark:text-gray-400">
												{result.subtitle}
											</div>
										</div>
										<div className="text-xs text-gray-400">
											{result.type === 'organization' ? 'Организация' : 'Склад'}
										</div>
									</div>
								</button>
							))}
						</div>
					)}

					{isSearching && searchQuery && (
						<div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 text-center text-gray-500">
							Поиск...
						</div>
					)}

					{!isSearching && searchQuery && searchResults.length === 0 && (
						<div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 text-center text-gray-500">
							Ничего не найдено
						</div>
					)}
				</div>
			</div>

			{/* Карта */}
			<div className="flex-1 min-h-0">
				<Map ref={mapRef} markers={allMarkers} height="100%" />
			</div>
		</div>
	);
}
