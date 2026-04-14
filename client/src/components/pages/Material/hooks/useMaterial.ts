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
		queryKey: ['material3dObject', materialData?.data?.id],
		//@ts-expect-error тут ошибка вылазит по поводу .data, но в enabled стоит проверка, так что не надо тут ругаться
		queryFn: () => material3dService.findByMaterialId(materialData.data.id),
		retry: false,
		enabled: !!materialData?.data?.id,
	});

	return {
		materialData,
		isMaterialDataPending,
		materialDataError,
		material3dObject: material3dObjectError ? null : material3dObject,
		isMaterial3dObjectPending,
		material3dObjectError,
	};
};
