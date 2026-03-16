// client/src/pages/Agreements/types/validation.ts
import { z } from 'zod';

export const agreementSchema = z.object({
	// Поставщик
	supplierOrg: z
		.number({ error: 'Выберите организацию поставщика' })
		.min(1, 'Выберите организацию поставщика'),
	supplierManager: z
		.number({ error: 'Выберите ответственное лицо поставщика' })
		.min(1, 'Выберите ответственное лицо поставщика'),
	supplierWarehouse: z
		.number({ error: 'Выберите склад поставщика' })
		.min(1, 'Выберите склад поставщика'),

	// Покупатель
	customerOrg: z
		.number({ error: 'Выберите организацию покупателя' })
		.min(1, 'Выберите организацию покупателя'),
	customerManager: z
		.number({ error: 'Выберите ответственное лицо покупателя' })
		.min(1, 'Выберите ответственное лицо покупателя'),
	customerWarehouse: z
		.number({ error: 'Выберите склад покупателя' })
		.min(1, 'Выберите склад покупателя'),

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
});

export type AgreementFormValues = z.infer<typeof agreementSchema>;
