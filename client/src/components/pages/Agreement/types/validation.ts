// client/src/pages/Agreements/types/validation.ts
import { z } from 'zod';

export const agreementSchema = z
	.object({
		// Поставщик
		supplierOrg: z.number().optional(),
		supplierManager: z.number().optional(),
		supplierWarehouse: z.number().optional(),

		// Покупатель
		customerOrg: z.number().optional(),
		customerManager: z.number().optional(),
		customerWarehouse: z.number().optional(),

		// Материалы
		materials: z
			.array(
				z.object({
					id: z.string(),
					material_id: z.number(),
					name: z.string(),
					amount: z.number().min(1, 'Количество должно быть больше 0'),
					maxAmount: z.number().optional(),
				})
			)
			.min(1, 'Добавьте хотя бы один материал'),
	})
	.refine(
		(data) => {
			// Проверяем, что все обязательные поля заполнены
			return (
				!!data.supplierOrg &&
				!!data.supplierManager &&
				!!data.supplierWarehouse &&
				!!data.customerOrg &&
				!!data.customerManager &&
				!!data.customerWarehouse
			);
		},
		{
			message: 'Все поля должны быть заполнены',
		}
	);

export type AgreementFormValues = z.infer<typeof agreementSchema>;
