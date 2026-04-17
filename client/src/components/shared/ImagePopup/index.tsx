// client/src/components/shared/ImagePopup.tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ImagePopupProps {
	imageUrl: string;
	mouseX: number;
	mouseY: number;
	onClose?: () => void;
}

export function ImagePopup({ imageUrl, mouseX, mouseY, onClose }: ImagePopupProps) {
	const [position, setPosition] = useState({ x: mouseX + 15, y: mouseY + 15 });

	useEffect(() => {
		// Корректируем позицию, чтобы попап не выходил за пределы экрана
		const popupWidth = 200;
		const popupHeight = 200;
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let newX = mouseX + 15;
		let newY = mouseY + 15;

		if (newX + popupWidth > viewportWidth) {
			newX = mouseX - popupWidth - 15;
		}
		if (newY + popupHeight > viewportHeight) {
			newY = mouseY - popupHeight - 15;
		}

		setPosition({ x: newX, y: newY });
	}, [mouseX, mouseY]);

	useEffect(() => {
		const handleClickOutside = () => {
			onClose?.();
		};

		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	}, [onClose]);

	return createPortal(
		<div
			className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
			style={{
				left: position.x,
				top: position.y,
				width: '200px',
				height: '200px',
			}}
		>
			<img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
		</div>,
		document.body
	);
}
