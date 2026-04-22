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
		onSuccess: () => {
			// Инвалидируем оба запроса (инфо и модель)
			queryClient.invalidateQueries({ queryKey: ['material3d', 'info', materialId] });
			queryClient.invalidateQueries({ queryKey: ['material3d', 'model', materialId] });
			onSuccess?.();
		},
		retry: false, // Без повторных попыток при ошибке
		onError,
	});

	const updateMutation = useMutation({
		mutationFn: async ({ format, file }: { format?: string; file?: File }) => {
			return await material3dService.update(materialId, format, file);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['material3d', 'info', materialId] });
			queryClient.invalidateQueries({ queryKey: ['material3d', 'model', materialId] });
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
			// Очищаем кеш после удаления
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
