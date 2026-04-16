import { FaUpload } from 'react-icons/fa';
import { ALLOWED_3D_EXTENSIONS } from '../utils/fileUtils';

interface DropZoneProps {
	onClick: () => void;
	onDragOver: (e: React.DragEvent) => void;
	onDrop: (e: React.DragEvent) => void;
	title?: string;
	subtitle?: string;
	hint?: string;
}

export function DropZone({
	onClick,
	onDragOver,
	onDrop,
	title = 'Загрузить 3D объект',
	subtitle = `Поддерживаемые форматы: ${ALLOWED_3D_EXTENSIONS.join(', ')}`,
	hint = 'Перетащите файл или кликните для выбора',
}: DropZoneProps) {
	return (
		<div
			className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm cursor-pointer hover:bg-gray-50 transition-colors rounded-lg"
			onClick={onClick}
			onDragOver={onDragOver}
			onDrop={onDrop}
		>
			<FaUpload className="text-gray-400 text-5xl mb-4" />
			<p className="text-gray-500 text-lg">{title}</p>
			<p className="text-gray-400 text-sm mt-2">{subtitle}</p>
			<p className="text-gray-400 text-xs mt-1">{hint}</p>
		</div>
	);
}
