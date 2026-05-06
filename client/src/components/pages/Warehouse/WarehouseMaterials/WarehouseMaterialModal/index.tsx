// client/src/pages/warehouses/WarehouseMaterialModal.tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { materialService } from '@/services/materialService';
import { NumberField } from '@/components/shared/Fields';

interface WarehouseMaterialModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	warehouseId: number;
	selectedItem?: {
		id: number;
		material_id: number;
		name: string;
		amount: number;
	} | null;
	onSubmit: (data: any) => Promise<void>;
	onSuccess?: () => void;
}

export function WarehouseMaterialModal({
	open,
	setOpen,
	selectedItem,
	onSubmit,
	onSuccess,
}: WarehouseMaterialModalProps) {
	const [materialSearch, setMaterialSearch] = useState('');
	const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
	const [amount, setAmount] = useState<number>(1);
	const [error, setError] = useState<string | null>(null);

	const isEditing = !!selectedItem?.id;

	const { data: materialsData } = useQuery({
		queryKey: ['materials'],
		queryFn: () => materialService.findAll(),
		enabled: open && !isEditing,
	});

	const { data: searchedMaterials, isLoading: isSearching } = useQuery({
		queryKey: ['materials', 'search', materialSearch],
		queryFn: () => materialService.search(materialSearch),
		enabled: open && materialSearch.length > 0 && !isEditing,
	});

	useEffect(() => {
		if (open) {
			if (isEditing && selectedItem) {
				setSelectedMaterialId(selectedItem.material_id);
				setAmount(selectedItem.amount);
			} else {
				setSelectedMaterialId(null);
				setAmount(1);
			}
			setMaterialSearch('');
			setError(null);
		}
	}, [open, isEditing, selectedItem]);

	const materials = (materialSearch.length > 0 ? searchedMaterials?.data : materialsData?.data) || [];

	const handleSubmit = async () => {
		if (!isEditing && !selectedMaterialId) {
			setError('Выберите материал');
			throw new Error('Выберите материал');
		}
		if (amount < 0) {
			setError('Количество не может быть отрицательным');
			throw new Error('Количество не может быть отрицательным');
		}

		const formData = isEditing ? { amount } : { material_id: selectedMaterialId, amount };

		try {
			await onSubmit(formData);
			setOpen(false);
			setSelectedMaterialId(null);
			setAmount(1);
			setMaterialSearch('');
			setError(null);
			onSuccess?.();
		} catch (err: any) {
			setError(err?.response?.data?.error || err?.message || 'Не удалось сохранить');
			throw err;
		}
	};

	const actionName = isEditing ? 'изменение количества материала' : 'добавление материала';
	const confirmText = isEditing ? 'Сохранить' : 'Добавить';

	return (
		<ConfirmModal
			open={open}
			setOpen={setOpen}
			actionName={actionName}
			onConfirm={handleSubmit}
			confirmText={confirmText}
			cancelText="Отмена"
			error={error}
		>
			<div className="space-y-4 py-4">
				{isEditing ? (
					<p className="text-gray-900 dark:text-white">
						Материал: <span className="font-medium">{selectedItem?.name}</span>
					</p>
				) : (
					<SearchableSelect
						label="Материал"
						value={selectedMaterialId}
						onChange={setSelectedMaterialId}
						options={materials}
						onSearch={setMaterialSearch}
						isLoading={isSearching}
						getOptionLabel={(material) => `${material.name} (${material.unit})`}
						placeholder="Поиск материала..."
						required
					/>
				)}

				<NumberField
					label="Количество"
					value={amount}
					onChange={(val) => {
						setAmount(Number(val));
						setError(null);
					}}
					required
				/>
			</div>
		</ConfirmModal>
	);
}
