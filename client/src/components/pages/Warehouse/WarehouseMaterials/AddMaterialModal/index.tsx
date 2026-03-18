// client/src/pages/warehouses/AddMaterialModal.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { materialService } from '@/services';
import { warehouseService } from '@/services/warehouseService';
import { NumberField } from '@/components/shared/Fields';

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

	// Получение всех материалов
	const { data: materialsData } = useQuery({
		queryKey: ['materials'],
		queryFn: () => materialService.findAll(),
		enabled: open,
	});

	// Поиск материалов
	const { data: searchedMaterials, isLoading: isSearching } = useQuery({
		queryKey: ['materials', 'search', materialSearch],
		queryFn: () => materialService.search(materialSearch),
		enabled: open && materialSearch.length > 0,
	});

	// Мутация для добавления материала на склад
	const { mutateAsync: addMaterial, isPending } = useMutation({
		mutationFn: ({ materialId, amount }: { materialId: number; amount: number }) =>
			warehouseService.addMaterial(warehouseId, materialId, amount),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['warehouse-materials', warehouseId] });
			onSuccess?.();
			setOpen(false);
			setSelectedMaterialId(null);
			setAmount(1);
			setMaterialSearch('');
		},
	});

	const materials =
		materialSearch.length > 0 ? searchedMaterials?.data || [] : materialsData?.data || [];

	const handleSubmit = async () => {
		if (selectedMaterialId && amount > 0) {
			await addMaterial({ materialId: selectedMaterialId, amount });
		}
	};

	return (
		<ConfirmModal
			open={open}
			setOpen={setOpen}
			actionName="добавление материала"
			onConfirm={handleSubmit}
			confirmText="Добавить"
			cancelText="Отмена"
		>
			<div className="space-y-4 py-4">
				<SearchableSelect
					label="Материал"
					value={selectedMaterialId}
					onChange={setSelectedMaterialId}
					options={materials}
					onSearch={setMaterialSearch}
					isLoading={isSearching}
					getOptionLabel={(material) => material.name}
					placeholder="Поиск материала..."
					required
				/>

				<NumberField
					label="Количество"
					value={amount}
					onChange={(val) => setAmount(Number(val))}
					required
				/>
			</div>
		</ConfirmModal>
	);
}
