// components/ui/Field/SelectField.tsx
import { Field } from '@base-ui/react/field';
import type { SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
	label: string;
	options: Array<{ value: string; label: string }>;
	placeholder?: string;
	error?: string;
	description?: string;
	required?: boolean;
}

export function SelectField({
	label,
	options,
	placeholder = 'Выберите...',
	error,
	description,
	required,
	className = '',
	...props
}: SelectFieldProps) {
	return (
		<Field.Root className="space-y-1">
			<Field.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
				{label} {required && <span className="text-red-500">*</span>}
			</Field.Label>
			{/* Не используем Field.Control для select */}
			<select
				className={`cursor-pointer w-full px-3 py-2 bg-white dark:bg-black border ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
				{...props}
			>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			{description && (
				<Field.Description className="text-sm text-gray-500 dark:text-gray-400">
					{description}
				</Field.Description>
			)}
			{error && (
				<Field.Error className="text-sm text-red-600 dark:text-red-400">{error}</Field.Error>
			)}
		</Field.Root>
	);
}
