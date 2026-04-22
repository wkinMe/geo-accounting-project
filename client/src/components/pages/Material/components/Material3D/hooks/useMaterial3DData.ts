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
		retry: false, // Без повторных попыток
		staleTime: 5 * 60 * 1000, // 5 минут считаем данные свежими
		gcTime: 10 * 60 * 1000, // Храним в кеше 10 минут
	});

	// Запрос для скачивания бинарных данных модели
	const {
		data: modelBlob,
		isLoading: isModelLoading,
		error: modelError,
	} = useQuery({
		queryKey: ['material3d', 'model', materialId],
		queryFn: () => material3dService.downloadModel(materialId),
		enabled: !!materialId && !!modelInfo, // Скачиваем только если модель существует
		retry: false, // Без повторных попыток
		staleTime: Infinity, // Бинарные данные не устаревают
		gcTime: 30 * 60 * 1000, // Храним в кеше 30 минут
	});

	return {
		isLoading: isLoading || (!!modelInfo && isModelLoading),
		hasExistingModel: !!modelInfo,
		modelDataForView: modelBlob || null,
		modelFormat: modelInfo?.format || null,
		error: error || modelError,
	};
}
