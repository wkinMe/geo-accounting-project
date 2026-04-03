// src/components/shared/Map/hooks/useMapSearch.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import type { SearchableItem } from '../types';

interface UseMapSearchProps {
	items?: SearchableItem[];
	onSearch?: (query: string) => Promise<SearchableItem[]> | SearchableItem[];
	debounceMs?: number;
}

export function useMapSearch({ items, onSearch, debounceMs = 300 }: UseMapSearchProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<SearchableItem[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

	const performSearch = useCallback(
		async (query: string) => {
			if (!query.trim()) {
				setSearchResults([]);
				return;
			}

			setIsSearching(true);

			try {
				let results: SearchableItem[] = [];

				if (onSearch) {
					const searchResult = await onSearch(query);
					results = searchResult;
				} else if (items) {
					results = items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
				}

				setSearchResults(results);
			} catch (error) {
				console.error('Search error:', error);
				setSearchResults([]);
			} finally {
				setIsSearching(false);
			}
		},
		[items, onSearch]
	);

	useEffect(() => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			performSearch(searchQuery);
		}, debounceMs);

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [searchQuery, performSearch, debounceMs]);

	const clearSearch = useCallback(() => {
		setSearchQuery('');
		setSearchResults([]);
	}, []);

	return {
		searchQuery,
		setSearchQuery,
		searchResults,
		isSearching,
		clearSearch,
	};
}
