// client/src/pages/materials/components/MaterialInfo.tsx
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatDateToDDMMYYYY, getDaysAgoText } from '@/utils';
import type { Material } from '@shared/models';
import { MaterialImage } from './components/MaterialImage';

interface MaterialInfoProps extends Material {
	className?: string;
}

export function MaterialInfo({
	id,
	name,
	unit,
	created_at,
	updated_at,
	className = '',
}: MaterialInfoProps) {
	const queryClient = useQueryClient();

	useEffect(() => {
		queryClient.invalidateQueries({ queryKey: ['materialImage', id] });
	}, [id, queryClient]);

	return (
		<div className={`shadow-md bg-white rounded-2xl py-4 px-8 ${className}`}>
			<div className="flex flex-col md:flex-row gap-6">
				<div className="w-full md:w-64 lg:w-80 xl:w-96 shrink-0">
					<div className="aspect-square">
						<MaterialImage materialId={id} className="w-full h-full rounded-lg" />
					</div>
				</div>

				<div className="flex-1">
					<table className="w-full border-collapse">
						<tbody>
							<tr className="border-b border-gray-200">
								<td className="py-3 font-medium text-gray-600 w-60">Название материала:</td>
								<td className="py-3">{name}</td>
							</tr>
							<tr className="border-b border-gray-200">
								<td className="py-3 font-medium text-gray-600">Единица измерения:</td>
								<td className="py-3">{unit}</td>
							</tr>
							<tr className="border-b border-gray-200">
								<td className="py-3 font-medium text-gray-600">Дата создания:</td>
								<td className="py-3">{formatDateToDDMMYYYY(created_at)}</td>
							</tr>
							<tr className="border-b border-gray-200">
								<td className="py-3 font-medium text-gray-600">Последнее обновление:</td>
								<td className="py-3">{getDaysAgoText(updated_at)}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
