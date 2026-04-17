// client/src/pages/materials/components/MaterialImage.tsx
import { FaImage } from 'react-icons/fa';
import { useMaterialImage } from './hooks';

interface MaterialImageProps {
	materialId: number;
	className?: string;
}

export function MaterialImage({ materialId, className = '' }: MaterialImageProps) {
	const { imageUrl, isLoading, error } = useMaterialImage(materialId);

	if (isLoading) {
		return (
			<div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
				<div className="animate-pulse flex flex-col items-center">
					<FaImage className="text-gray-400 text-4xl mb-2" />
					<p className="text-gray-400 text-sm">Загрузка...</p>
				</div>
			</div>
		);
	}

	if (error || !imageUrl) {
		return (
			<div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
				<div className="flex flex-col items-center">
					<FaImage className="text-gray-400 text-4xl mb-2" />
					<p className="text-gray-400 text-sm">Нет изображения</p>
				</div>
			</div>
		);
	}

	return (
		<img
			src={imageUrl}
			alt="Material"
			className={`w-full h-full object-cover rounded-lg ${className}`}
		/>
	);
}
