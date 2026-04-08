// src/components/shared/Map/components/MapSearch.tsx
import { SearchInput } from '@/components/shared/SearchInput';
import type { SearchableItem } from '../../types';

interface MapSearchProps {
	searchQuery: string;
	searchResults: SearchableItem[];
	isSearching: boolean;
	placeholder?: string;
	onSelectResult: (result: SearchableItem) => void;
	onSearchQueryChange: (query: string) => void;
}

export function MapSearch({
	searchQuery,
	searchResults,
	isSearching,
	placeholder = 'Поиск...',
	onSelectResult,
	onSearchQueryChange,
}: MapSearchProps) {
	return (
		<div className="shrink-0 p-0.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
			<div className="relative w-[90%] mx-auto">
				<SearchInput
					value={searchQuery}
					ms={300}
					onSearch={onSearchQueryChange}
					placeholder={placeholder}
					className="w-full"
				/>

				{/* Результаты поиска */}
				{searchResults.length > 0 && !isSearching && (
					<div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto z-1000">
						{searchResults.map((result) => (
							<button
								key={`${result.type}-${result.id}`}
								onClick={() => onSelectResult(result)}
								className="w-full cursor-pointer text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
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

				{/* Состояние загрузки */}
				{isSearching && searchQuery && (
					<div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 text-center text-gray-500">
						Поиск...
					</div>
				)}

				{/* Нет результатов */}
				{!isSearching && searchQuery && searchResults.length === 0 && (
					<div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 text-center text-gray-500">
						Ничего не найдено
					</div>
				)}
			</div>
		</div>
	);
}
