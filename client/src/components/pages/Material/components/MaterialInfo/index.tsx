import { formatDateToDDMMYYYY, getDaysAgoText } from '@/utils';
import type { Material } from '@shared/models';

export function MaterialInfo({ name, unit, created_at, updated_at }: Material) {
	return (
		<div className="shadow-md bg-white rounded-2xl py-4 px-8">
			<table className="w-full border-collapse">
				<tbody>
					<tr className="border-b border-gray-200">
						<td className="py-3 font-medium text-gray-600 w-60">Название материала: </td>
						<td className="py-3">{name}</td>
					</tr>
					<tr className="border-b border-gray-200">
						<td className="py-3 font-medium text-gray-600">Единица измерения: </td>
						<td className="py-3">{unit}</td>
					</tr>
					<tr className="border-b border-gray-200">
						<td className="py-3 font-medium text-gray-600">Дата создания: </td>
						<td className="py-3">{formatDateToDDMMYYYY(created_at)}</td>
					</tr>
					<tr className="border-b border-gray-200">
						<td className="py-3 font-medium text-gray-600">Последнее обновление: </td>
						<td className="py-3">{getDaysAgoText(updated_at)}</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
