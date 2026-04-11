import { materialService } from '@/services';
import { material3dService } from '@/services/material3DService';
import { useQuery } from '@tanstack/react-query';

export const useMaterial = (id: number) => {
	const {
		data: materialData,
		isPending: isMaterialDataPending,
		error: materialDataError,
	} = useQuery({
		queryKey: ['material', id],
		queryFn: () => materialService.findById(id),
		retry: false,
	});

	const {
		data: material3dObject,
		isPending: isMaterial3dObjectPending,
		error: material3dObjectError,
	} = useQuery({
		queryKey: ['material3dObject', id],
		queryFn: () => materialData?.data && material3dService.findByMaterialId(materialData?.data.id),
		retry: false,
	});

	return {
		materialData,
		isMaterialDataPending,
		materialDataError,
		material3dObject: material3dObjectError ? null : material3dObject,
		isMaterial3dObjectPending,
	};
};
