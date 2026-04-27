// client/src/pages/warehouses/WarehouseInfo.tsx
import { warehouseService } from '@/services';
import type { UpdateWarehouseDTO } from '@shared/dto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { Button } from '@/components/shared/Button';
import { formatDateToDDMMYYYY, getDaysAgoText } from '@/utils/dateFormatters';
import { Link } from 'react-router';
import { WarehouseModal } from '../../WarehousesList/WarehouseModal';

interface Props {
	id: number;
	canEdit?: boolean;
	canDelete?: boolean;
}

export function WarehouseInfo({ id, canEdit = false, canDelete = false }: Props) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const queryClient = useQueryClient();
	const { data: warehouse } = useQuery({
		queryKey: ['warehouse', id],
		queryFn: () => warehouseService.findById(id),
	});

	const { mutateAsync: deleteMutate } = useMutation({
		mutationFn: async () => warehouseService.delete(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['warehouses'] });
			window.location.href = '/warehouses';
		},
		onError: (err: any) => {
			setError(err?.response?.data?.error || err?.message || 'Не удалось удалить склад');
		},
	});

	const { mutateAsync: updateMutate, isPending: isUpdating } = useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateWarehouseDTO }) =>
			warehouseService.update(id, data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['warehouse', id] });
			await queryClient.invalidateQueries({ queryKey: ['warehouses'] });
			setIsModalOpen(false);
		},
		onError: (err: any) => {
			setError(err?.response?.data?.error || err?.message || 'Не удалось обновить склад');
		},
	});

	const warehouseData = warehouse;

	const handleSubmit = async (data: UpdateWarehouseDTO) => {
		if (warehouseData) {
			await updateMutate({ id: warehouseData.id, data });
		}
	};

	const handleConfirm = async () => {
		await deleteMutate();
	};

	if (!warehouseData) {
		return <h1>Информация о данном складе не найдена</h1>;
	}

	return (
		<>
			<div className="flex justify-between">
				<div className="w-full bg-white p-5 rounded-2xl pb-10">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl text-black font-medium mb-5">{warehouseData.name}</h1>
						<div className="flex gap-5">
							{canEdit && (
								<Button variant="secondary" onClick={() => setIsModalOpen(true)}>
									Изменить
								</Button>
							)}

							{canDelete && (
								<Button
									className={'bg-red-500 hover:bg-red-600'}
									onClick={() => setIsConfirmOpen(true)}
								>
									Удалить
								</Button>
							)}
						</div>
					</div>

					{error && (
						<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
							❌ {error}
						</div>
					)}

					<table className="w-full border-collapse">
						<tbody>
							<tr className="border-b border-gray-200">
								<td className="py-3 font-medium text-gray-600 w-60">Организация владелец: </td>
								<td className="py-3">{warehouseData.organization?.name}</td>
							</tr>
							<tr className="border-b border-gray-200">
								<td className="py-3 font-medium text-gray-600">Менеджер склада: </td>
								<td className="py-3">
									{warehouseData.manager ? (
										<Link to={`/users/${warehouseData.manager?.id}`}>
											{warehouseData.manager?.name}
										</Link>
									) : (
										'Не назначен'
									)}
								</td>
							</tr>
							<tr className="border-b border-gray-200">
								<td className="py-3 font-medium text-gray-600">Дата создания: </td>
								<td className="py-3">{formatDateToDDMMYYYY(warehouseData.created_at)}</td>
							</tr>
							<tr className="border-b border-gray-200">
								<td className="py-3 font-medium text-gray-600">Последнее обновление: </td>
								<td className="py-3">{getDaysAgoText(warehouseData.updated_at)}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<ConfirmModal
				onConfirm={handleConfirm}
				actionName={'удаление'}
				open={isConfirmOpen}
				setOpen={setIsConfirmOpen}
			>
				<div className="h-30">Вы уверены, что хотите удалить склад?</div>
			</ConfirmModal>
			<WarehouseModal
				open={isModalOpen}
				setOpen={setIsModalOpen}
				warehouse={warehouseData}
				onSubmit={handleSubmit}
				isLoading={isUpdating}
			/>
		</>
	);
}
