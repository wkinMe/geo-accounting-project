// client/src/pages/Agreements/components/MaterialsSection/index.tsx
import { useState } from 'react';
import { useMaterialsByWarehouse } from '@/hooks/useMaterialsByWarehouse';
import { SearchInput } from '@/components/shared/SearchInput';
import { MaterialRow } from '../MaterialRow';
import { useAgreementFormStore } from '../../store';
import { useFormContext } from 'react-hook-form';
import type { AgreementFormValues } from '../../types';
import { type AgreementStatus } from '@shared/constants';

interface MaterialsSectionProps {
	isEditing?: boolean;
	canEdit?: boolean;
	currentStatus?: AgreementStatus;
}

export function MaterialsSection({ isEditing = false, canEdit = true }: MaterialsSectionProps) {
	const [isSearchFocused, setIsSearchFocused] = useState(false);

	const {
		supplierWarehouse,
		materialSearchQuery,
		materials,
		setMaterialSearchQuery,
		addMaterial,
		removeMaterial,
		updateMaterialAmount,
	} = useAgreementFormStore();

	const { data: displayMaterials } = useMaterialsByWarehouse(
		supplierWarehouse,
		materialSearchQuery,
	);

	const {
		formState: { errors, isSubmitted },
	} = useFormContext<AgreementFormValues>();

	const handleAddMaterial = (material: { material_id: number; name: string; amount: number }) => {
		if (!canEdit) return;

		addMaterial({
			material_id: material.material_id,
			name: material.name,
			amount: 0,
			maxAmount: material.amount,
		});
		setMaterialSearchQuery('');
		setIsSearchFocused(false);
	};

	const handleBlur = () => {
		setTimeout(() => {
			setIsSearchFocused(false);
		}, 200);
	};

	const handleFocus = () => {
		if (!canEdit) return;
		setIsSearchFocused(true);
	};

	const showDropdown =
		isSearchFocused && canEdit && displayMaterials && displayMaterials.length > 0;

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold">
				Материалы
				{!canEdit && isEditing && (
					<span className="ml-2 text-sm font-normal text-amber-600 dark:text-amber-400">
						(только просмотр)
					</span>
				)}
			</h2>

			<div className="relative">
				{canEdit && (
					<SearchInput
						value={materialSearchQuery}
						onSearch={setMaterialSearchQuery}
						placeholder="Поиск материалов..."
						disabled={!supplierWarehouse || !canEdit}
						ms={0}
						onFocus={handleFocus}
						onBlur={handleBlur}
					/>
				)}
				{showDropdown && (
					<div className="absolute z-10 w-full mt-1 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto">
						{displayMaterials.map((item) => (
							<button
								key={item.material_id}
								type="button"
								className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
								onClick={() =>
									handleAddMaterial({
										material_id: item.material_id,
										name: item.material.name,
										amount: item.amount,
									})
								}
								disabled={materials.some((m) => m.material_id === item.material_id)}
							>
								<div className="flex justify-between items-center">
									<span>{item.material.name}</span>
									<span className="text-sm text-gray-500">В наличии: {item.amount}</span>
								</div>
							</button>
						))}
					</div>
				)}

				{materialSearchQuery.length > 0 &&
					!showDropdown &&
					isSearchFocused &&
					canEdit &&
					displayMaterials?.length === 0 && (
						<div className="absolute z-10 w-full mt-1 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-4 text-center text-gray-500">
							Материалы не найдены
						</div>
					)}
			</div>

			{materials.length > 0 ? (
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
						<thead className="bg-gray-50 dark:bg-gray-900">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Материал
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Количество
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Доступно
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Действия
								</th>
							</tr>
						</thead>
						<tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-gray-800">
							{materials.map((material) => (
								<MaterialRow
									key={material.id}
									material={material}
									onUpdateAmount={updateMaterialAmount}
									onRemove={removeMaterial}
									canEdit={canEdit}
								/>
							))}
						</tbody>
					</table>
				</div>
			) : (
				errors.materials &&
				isSubmitted && (
					<p className="text-sm text-red-600 dark:text-red-400 mt-2">{errors.materials.message}</p>
				)
			)}
		</div>
	);
}
