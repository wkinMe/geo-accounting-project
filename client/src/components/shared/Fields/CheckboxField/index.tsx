// components/ui/Checkbox/CheckboxField.tsx
import { Checkbox } from '@base-ui/react/checkbox';
import type { CheckboxRootProps } from '@base-ui/react/checkbox';

interface CheckboxFieldProps extends CheckboxRootProps {
	label: string;
	error?: string;
	description?: string;
}

export function CheckboxField({
	label,
	error,
	description,
	className = '',
	...props
}: CheckboxFieldProps) {
	return (
		<label className="flex items-start gap-2 cursor-pointer group">
			<Checkbox.Root
				className={`
          w-5 h-5 flex items-center justify-center rounded border 
          ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}
          bg-white dark:bg-black 
          group-hover:bg-gray-50 dark:group-hover:bg-gray-900
          data-checked:bg-black data-checked:dark:bg-white 
          data-checked:border-black data-checked:dark:border-white
          focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
          ${className}
        `}
				{...props}
			>
				<Checkbox.Indicator className="text-white dark:text-black">
					<svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10">
						<path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
					</svg>
				</Checkbox.Indicator>
			</Checkbox.Root>

			<span className="text-sm text-gray-700 dark:text-gray-300 select-none">{label}</span>

			{description && (
				<span className="text-sm text-gray-500 dark:text-gray-400">{description}</span>
			)}

			{error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
		</label>
	);
}
