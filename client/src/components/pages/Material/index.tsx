// client/src/pages/materials/Material.tsx
import { useParams } from 'react-router';
import { useMaterial } from './hooks/useMaterial';
import Spinner from '@/components/shared/Spinner';
import { MaterialInfo } from './components/MaterialInfo';
import { Material3D } from './components/Material3D';

export function Material() {
	const params = useParams();
	const id = Number(params?.id);

	const { materialData, isMaterialDataPending, materialDataError } = useMaterial(id);

	if (isMaterialDataPending) {
		return <Spinner />;
	}

	if (materialDataError) {
		return (
			<div className="h-[85vh] flex justify-center items-center">
				<h1 className="text-2xl">Невозможно получить материал: {materialDataError.message}</h1>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5 h-[85vh]">
			{materialData && <MaterialInfo {...materialData} />}
			<Material3D materialId={materialData?.id || 0} />
		</div>
	);
}
