// client/src/pages/materials/hooks/useMaterialImage.ts
import { useQuery } from '@tanstack/react-query';
import { materialService } from '@/services/materialService';
import { useEffect, useState } from 'react';

export function useMaterialImage(materialId: number) {
	const [imageUrl, setImageUrl] = useState<string | null>(null);

	const {
		data: blob,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['materialImage', materialId],
		queryFn: () => materialService.getImageBlob(materialId),
		enabled: !!materialId && materialId > 0,
	});

	useEffect(() => {
		if (blob) {
			const url = URL.createObjectURL(blob);
			setImageUrl(url);

			return () => {
				URL.revokeObjectURL(url);
			};
		} else {
			setImageUrl(null);
		}
	}, [blob]);

	return { imageUrl, isLoading, error };
}
