// client/src/components/Material3D/hooks/useModelMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { material3dService } from '@/services/material3DService';

interface UseModelMutationsProps {
	materialId: number;
	onSuccess?: () => void;
	onError?: (error: any) => void;
}

export function useModelMutations({ materialId, onSuccess, onError }: UseModelMutationsProps) {
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: async ({ format, file }: { format: string; file: File }) => {
			return await material3dService.create(materialId, format, file);
		},
		onSuccess: (data) => {
			// Обновляем кеш без перезапроса
			queryClient.setQueryData(['material3d', 'info', materialId], data);

			// Для модели создаем новый Blob из загруженного файла
			// Но мы не знаем формат, поэтому лучше перезапросить модель
			queryClient.invalidateQueries({ queryKey: ['material3d', 'model', materialId] });
			onSuccess?.();
		},
		retry: false,
		onError,
	});

	const updateMutation = useMutation({
		mutationFn: async ({ format, file }: { format?: string; file?: File }) => {
			return await material3dService.update(materialId, format, file);
		},
		onSuccess: async (data, variables) => {
			// Обновляем информацию в кеше
			queryClient.setQueryData(['material3d', 'info', materialId], data);

			// Если был загружен новый файл, обновляем модель в кеше
			if (variables.file) {
				// Создаем Blob из выбранного файла
				const newModelBlob = variables.file;
				queryClient.setQueryData(['material3d', 'model', materialId], newModelBlob);
			}

			onSuccess?.();
		},
		retry: false,
		onError,
	});

	const deleteMutation = useMutation({
		mutationFn: async () => {
			await material3dService.delete(materialId);
		},
		onSuccess: () => {
			// Удаляем из кеша
			queryClient.removeQueries({ queryKey: ['material3d', 'info', materialId] });
			queryClient.removeQueries({ queryKey: ['material3d', 'model', materialId] });
			onSuccess?.();
		},
		retry: false,
		onError,
	});

	return {
		createMutation,
		updateMutation,
		deleteMutation,
	};
}
