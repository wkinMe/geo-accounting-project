// components/ui/Field/TextField.tsx
import { Field } from '@base-ui/react/field';
import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
	label: string;
	error?: string;
	description?: string;
	required?: boolean;
}

export function TextField({
	label,
	error,
	description,
	required,
	className = '',
	...props
}: TextFieldProps) {
	return (
		<Field.Root className="space-y-1">
			<Field.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
				{label} {required && <span className="text-red-500">*</span>}
			</Field.Label>

			<Field.Control
				className={`w-full px-3 py-2 bg-white dark:bg-black border ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
				{...props}
			/>
			{description && (
				<Field.Description className="text-sm text-gray-500 dark:text-gray-400">
					{description}
				</Field.Description>
			)}
			{error && (
				<span className="text-sm text-red-600 dark:text-red-400">{error}</span>
			)}
		</Field.Root>
	);
}
