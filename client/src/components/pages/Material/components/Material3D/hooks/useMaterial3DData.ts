// client/src/components/Material3D/hooks/useMaterial3DData.ts
import { useQuery } from '@tanstack/react-query';
import { material3dService } from '@/services/material3DService';

export function useMaterial3DData(materialId: number) {
	// Запрос для получения информации о модели
	const {
		data: modelInfo,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['material3d', 'info', materialId],
		queryFn: () => material3dService.findByMaterialId(materialId),
		enabled: !!materialId,
		retry: false,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	// Запрос для скачивания бинарных данных модели
	// Теперь не зависит от modelInfo - всегда пытаемся скачать, если есть materialId
	const {
		data: modelBlob,
		isLoading: isModelLoading,
		error: modelError,
	} = useQuery({
		queryKey: ['material3d', 'model', materialId],
		queryFn: () => material3dService.downloadModel(materialId),
		enabled: !!materialId, // Всегда пытаемся скачать, ошибка обработается в queryFn
		retry: false,
		staleTime: Infinity,
		gcTime: 30 * 60 * 1000,
	});

	return {
		isLoading: isLoading || isModelLoading,
		hasExistingModel: !!modelInfo,
		modelDataForView: modelBlob || null,
		modelFormat: modelInfo?.format || null,
		error: error || modelError,
	};
}
