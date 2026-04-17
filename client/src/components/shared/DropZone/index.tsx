// client/src/components/shared/DropZone.tsx
import { FaUpload } from 'react-icons/fa';

interface DropZoneProps {
	onClick: () => void;
	onDragOver: (e: React.DragEvent) => void;
	onDrop: (e: React.DragEvent) => void;
	title?: string;
	subtitle?: string;
	hint?: string;
	icon?: React.ReactNode;
	accept?: string;
	className?: string;
}

export function DropZone({
	onClick,
	onDragOver,
	onDrop,
	title = 'Загрузить файл',
	subtitle,
	hint = 'Перетащите файл или кликните для выбора',
	icon = <FaUpload className="text-gray-400 text-4xl mb-3" />,
	className = '',
}: DropZoneProps) {
	return (
		<div
			className={`w-full h-48 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors ${className}`}
			onClick={onClick}
			onDragOver={onDragOver}
			onDrop={onDrop}
		>
			{icon}
			<p className="text-gray-600 text-base font-medium">{title}</p>
			{subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
			<p className="text-gray-400 text-xs mt-1">{hint}</p>
		</div>
	);
}
