// client/src/components/shared/HoverPopup.tsx
import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface HoverPopupProps {
	visible: boolean;
	position: { x: number; y: number };
	children: React.ReactNode;
	onClose?: () => void;
	className?: string;
}

export function HoverPopup({
	visible,
	position,
	children,
	onClose,
	className = '',
}: HoverPopupProps) {
	const [adjustedPosition, setAdjustedPosition] = useState(position);

	useLayoutEffect(() => {
		if (visible) {
			const popupWidth = 200;
			const popupHeight = 200;
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			let newX = position.x + 15;
			let newY = position.y + 15;

			if (newX + popupWidth > viewportWidth) {
				newX = position.x - popupWidth - 15;
			}
			if (newY + popupHeight > viewportHeight) {
				newY = position.y - popupHeight - 15;
			}

			setAdjustedPosition({ x: newX, y: newY });
		}
	}, [position, visible]);

	if (!visible) return null;

	return createPortal(
		<div
			className={`fixed z-50 ${className}`}
			style={{
				left: adjustedPosition.x,
				top: adjustedPosition.y,
				pointerEvents: 'none',
			}}
			onMouseLeave={onClose}
		>
			{children}
		</div>,
		document.body
	);
}
