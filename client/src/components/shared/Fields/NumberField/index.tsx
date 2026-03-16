// client/src/components/shared/Fields/NumberField.tsx
import { Field } from '@base-ui/react/field';
import type { InputHTMLAttributes } from 'react';

interface NumberFieldProps extends Omit<
	InputHTMLAttributes<HTMLInputElement>,
	'value' | 'onChange'
> {
	label: string;
	value: number;
	onChange: (value: number) => void;
	error?: string;
	description?: string;
	required?: boolean;
	min?: number;
	max?: number;
	step?: number;
	allowNegative?: boolean;
}

export function NumberField({
	label,
	value,
	onChange,
	error,
	description,
	required,
	min,
	max,
	step = 0.01,
	allowNegative = false,
	className = '',
	disabled,
	...props
}: NumberFieldProps) {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = e.target.value;

		if (inputValue === '') {
			onChange(0);
			return;
		}

		const numberRegex = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;

		if (!numberRegex.test(inputValue)) {
			return;
		}

		if ((inputValue.match(/\./g) || []).length > 1) {
			return;
		}

		if (allowNegative) {
			const minusCount = (inputValue.match(/-/g) || []).length;
			if (minusCount > 1 || (minusCount === 1 && !inputValue.startsWith('-'))) {
				return;
			}
		}

		if (inputValue.endsWith('.')) {
			onChange(parseFloat(inputValue + '0'));
			return;
		}

		const numericValue = Number(inputValue);

		if (isNaN(numericValue)) {
			return;
		}

		if (!allowNegative && numericValue < 0) {
			return;
		}

		if (min !== undefined && numericValue < min) {
			onChange(min);
			return;
		}

		if (max !== undefined && numericValue > max) {
			onChange(max);
			return;
		}

		onChange(numericValue);
	};

	const handleBlur = () => {
		if (value === undefined || isNaN(value)) {
			onChange(min !== undefined ? min : 0);
			return;
		}

		if (min !== undefined && value < min) {
			onChange(min);
		}
		if (max !== undefined && value > max) {
			onChange(max);
		}
	};

	const displayValue = value === 0 ? '' : value.toString();

	return (
		<Field.Root className="space-y-1">
			<Field.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
				{label} {required && <span className="text-red-500">*</span>}
			</Field.Label>
			<Field.Control
				type="text"
				inputMode="decimal"
				value={displayValue}
				onChange={handleChange}
				onBlur={handleBlur}
				placeholder={min !== undefined ? `Min: ${min}` : '0'}
				disabled={disabled}
				className={`w-full px-3 py-2 bg-white dark:bg-black border ${
					error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'
				} rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white ${className}`}
				{...props}
			/>
			{description && (
				<Field.Description className="text-sm text-gray-500 dark:text-gray-400">
					{description}
				</Field.Description>
			)}
			{error && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>}
		</Field.Root>
	);
}
