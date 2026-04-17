// client/src/components/shared/Table/types.ts
import { ReactNode } from 'react';

export interface Column<T> {
	key: keyof T;
	label: string;
	width?: string;
	align?: 'left' | 'center' | 'right';
	render?: (value: any, item: T) => ReactNode;
}

export interface HoverDelayAction<T> {
	delay?: number;
	onHoverDelayComplete: (item: T, event: React.MouseEvent) => void;
}

export interface Action<T> {
	name: string;
	action: (item: T) => void | Promise<void>;
	icon: ReactNode;
	hidden?: (item: T) => boolean;
	needConfirmation?: boolean;
	confirmationBody?: (item: T) => ReactNode;
	hoverDelay?: HoverDelayAction<T>;
}
