import { useParams } from 'react-router';
import { WarehouseInfo } from './WarehouseInfo';
import { WarehouseMaterials } from './WarehouseMaterials';

export function Warehouse() {
	const params = useParams();

	const id = Number(params?.id);

	return (
		<>
			<WarehouseInfo id={id} />
			<WarehouseMaterials id={id} />
		</>
	);
}
