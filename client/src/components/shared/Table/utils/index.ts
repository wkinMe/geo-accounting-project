import type { Action, Column } from '../types';

export const getVisibleActions = <T>(item: T, actions: Action<T>[] | undefined) => {
	return actions?.filter((action) => !action.hidden?.(item)) || [];
};

export const getColumns = <T>(columns: Column<T>[] | undefined, headers: readonly (keyof T)[] | undefined) => {
	return columns || (headers?.map((key) => ({ key, label: String(key) })) as Column<T>[]) || [];
};
