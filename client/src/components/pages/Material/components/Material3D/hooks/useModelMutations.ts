import { useMutation, useQueryClient } from '@tanstack/react-query';
import { material3dService } from '@/services/material3DService';

interface UseModelMutationsProps {
	materialId: number;
	onSuccess?: () => void;
	onError?: (error: any) => void;
}

export function useModelMutations({ materialId, onSuccess, onError }: UseModelMutationsProps) {
	const queryClient = useQueryClient();

	const invalidateQuery = () => {
		queryClient.invalidateQueries({ queryKey: ['material3d', materialId] });
	};

	const createMutation = useMutation({
		mutationFn: async (formData: FormData) => {
			return material3dService.create(formData);
		},
		onSuccess: () => {
			invalidateQuery();
			onSuccess?.();
		},
		onError: (err) => onError?.(err),
	});

	const updateMutation = useMutation({
		mutationFn: async (formData: FormData) => {
			return material3dService.update(formData);
		},
		onSuccess: () => {
			invalidateQuery();
			onSuccess?.();
		},
		onError: (err) => onError?.(err),
	});

	const deleteMutation = useMutation({
		mutationFn: async () => {
			return material3dService.delete(materialId);
		},
		onSuccess: () => {
			invalidateQuery();
			onSuccess?.();
		},
		onError: (err) => onError?.(err),
	});

	return {
		createMutation,
		updateMutation,
		deleteMutation,
	};
}
