// client/src/components/shared/ImagePopup.tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ImagePopupProps {
	imageUrl: string | null;
	isLoading: boolean;
	position: { x: number; y: number };
	visible: boolean;
	onClose: () => void;
}

export function ImagePopup({ imageUrl, isLoading, position, visible, onClose }: ImagePopupProps) {
	const [adjustedPosition, setAdjustedPosition] = useState(position);

	useEffect(() => {
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
			className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
			style={{
				left: adjustedPosition.x,
				top: adjustedPosition.y,
				width: '200px',
				height: '200px',
				pointerEvents: 'none',
			}}
		>
			{isLoading ? (
				<div className="w-full h-full flex items-center justify-center bg-gray-100">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
				</div>
			) : imageUrl ? (
				<img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
			) : (
				<div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
					<svg
						className="w-12 h-12 text-gray-400 mb-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					<p className="text-gray-400 text-sm text-center">Нет изображения</p>
				</div>
			)}
		</div>,
		document.body
	);
}
