// client/src/hooks/useDebounce.ts
import { useCallback, useRef } from 'react';

export function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number): T {
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	return useCallback(
		((...args: any[]) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			timeoutRef.current = setTimeout(() => {
				callback(...args);
			}, delay);
		}) as T,
		[callback, delay]
	);
}
