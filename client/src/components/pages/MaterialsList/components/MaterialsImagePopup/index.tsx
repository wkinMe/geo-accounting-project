// client/src/pages/materials/components/MaterialImagePopup.tsx
import { useQuery } from '@tanstack/react-query';
import { materialService } from '@/services/materialService';
import { useEffect, useState } from 'react';

interface MaterialImagePopupProps {
	materialId: number;
}

export function MaterialImagePopup({ materialId }: MaterialImagePopupProps) {
	const [imageUrl, setImageUrl] = useState<string | null>(null);

	const { data: imageBlob, isLoading } = useQuery({
		queryKey: ['materialImage', materialId],
		queryFn: () => materialService.getImageBlob(materialId),
		staleTime: 60 * 1000,
		retry: false,
	});

	useEffect(() => {
		if (imageBlob) {
			const url = URL.createObjectURL(imageBlob);
			setImageUrl(url);
			return () => URL.revokeObjectURL(url);
		} else if (imageBlob === null) {
			setImageUrl(null);
		}
	}, [imageBlob]);

	if (isLoading) {
		return (
			<div className="w-48 h-48 flex items-center justify-center bg-gray-100">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
			</div>
		);
	}

	if (imageUrl) {
		return <img src={imageUrl} alt="Preview" className="w-48 h-48 object-cover" />;
	}

	return (
		<div className="w-48 h-48 flex flex-col items-center justify-center bg-gray-100">
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
	);
}
