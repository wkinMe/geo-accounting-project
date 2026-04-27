// client/src/pages/warehouses/AddMaterialModal.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { materialService } from '@/services/materialService';
import { NumberField } from '@/components/shared/Fields';
import { inventoryService } from '@/services/intentoryService';

interface Props {
	open: boolean;
	setOpen: (open: boolean) => void;
	warehouseId: number;
	onSuccess?: () => void;
}

export function AddMaterialModal({ open, setOpen, warehouseId, onSuccess }: Props) {
	const queryClient = useQueryClient();
	const [materialSearch, setMaterialSearch] = useState('');
	const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
	const [amount, setAmount] = useState<number>(1);
	const [error, setError] = useState<string | null>(null);

	const { data: materialsData } = useQuery({
		queryKey: ['materials'],
		queryFn: () => materialService.findAll(),
		enabled: open,
	});

	const { data: searchedMaterials, isLoading: isSearching } = useQuery({
		queryKey: ['materials', 'search', materialSearch],
		queryFn: () => materialService.search(materialSearch),
		enabled: open && materialSearch.length > 0,
	});

	const { mutateAsync: addMaterial } = useMutation({
		mutationFn: ({ materialId, amount }: { materialId: number; amount: number }) =>
			inventoryService.addMaterial(warehouseId, materialId, amount),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['warehouseMaterials', warehouseId] });
			onSuccess?.();
			setOpen(false);
			setSelectedMaterialId(null);
			setAmount(1);
			setMaterialSearch('');
			setError(null);
		},
		onError: (err: any) => {
			setError(err?.response?.data?.error || err?.message || 'Не удалось добавить материал');
		},
	});

	const materials = materialSearch.length > 0 ? searchedMaterials || [] : materialsData || [];

	const handleSubmit = async () => {
		if (!selectedMaterialId) {
			setError('Выберите материал');
			throw new Error('Выберите материал');
		}
		if (amount <= 0) {
			setError('Количество должно быть больше 0');
			throw new Error('Количество должно быть больше 0');
		}
		await addMaterial({ materialId: selectedMaterialId, amount });
	};

	return (
		<ConfirmModal
			open={open}
			setOpen={setOpen}
			actionName="добавление материала"
			onConfirm={handleSubmit}
			confirmText="Добавить"
			cancelText="Отмена"
			error={error}
		>
			<div className="space-y-4 py-4">
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
