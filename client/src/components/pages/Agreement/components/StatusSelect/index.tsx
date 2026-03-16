import { useFormContext } from "react-hook-form";
import type { AgreementFormValues } from "../../types";
import { SelectField } from "@/components/shared/Fields";
import { AGREEMENT_STATUS_LABELS } from "@shared/constants/agreementStatuses";

export function StatusSelect() {
	const {
		register,
		formState: { errors },
	} = useFormContext<AgreementFormValues>();

	const statusOptions = Object.entries(AGREEMENT_STATUS_LABELS).map(([value, label]) => ({
		value,
		label,
	}));

	return (
		<SelectField
			label="Статус договора"
			options={statusOptions}
			error={errors.status?.message}
			{...register('status')}
			required
		/>
	);
}
