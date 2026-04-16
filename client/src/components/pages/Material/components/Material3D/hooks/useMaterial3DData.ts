import { useQuery } from '@tanstack/react-query';
import { material3dService } from '@/services/material3DService';

export function useMaterial3DData(materialId: number) {
	const {
		data: response,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['material3d', materialId],
		queryFn: async () => {
			const result = await material3dService.findByMaterialId(materialId);
			return result;
		},
		retry: (failureCount, error: any) => {
			if (error?.response?.status === 404) {
				return false;
			}
			return failureCount < 3;
		},
	});

	const material3D = response?.data;
	const hasExistingModel = !!material3D?.model_data?.data;
	const modelDataForView = material3D?.model_data?.data || null;
	const modelFormat = material3D?.format || null;

	return {
		material3D,
		isLoading,
		error,
		hasExistingModel,
		modelDataForView,
		modelFormat,
	};
}
