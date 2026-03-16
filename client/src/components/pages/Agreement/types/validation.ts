// client/src/pages/Agreements/types/validation.ts
import { z } from 'zod';

export const agreementSchema = z.object({
	// Поставщик
	supplierOrg: z.number({ error: 'Выберите организацию поставщика' }),
	supplierManager: z.number({ error: 'Выберите ответственное лицо' }),
	supplierWarehouse: z.number({ error: 'Выберите склад поставщика' }),

	// Покупатель
	customerOrg: z.number({ error: 'Выберите организацию покупателя' }),
	customerManager: z.number({ error: 'Выберите ответственное лицо' }),
	customerWarehouse: z.number({ error: 'Выберите склад покупателя' }),

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
