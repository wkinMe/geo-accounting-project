// client/src/components/shared/Select.tsx
import * as React from 'react';
import { Select } from '@base-ui/react/select';
import { Field } from '@base-ui/react/field';

interface Option {
	label: string;
	value: string;
}

interface CustomSelectProps {
	label?: string;
	value?: string | null;
	onChange?: (value: string) => void;
	options: Option[];
	placeholder?: string;
	error?: string;
	disabled?: boolean;
	required?: boolean;
	className?: string;
}

export default function CustomSelect({
	label,
	value,
	onChange,
	options,
	placeholder = 'Выберите...',
	error,
	disabled,
	required,
	className,
}: CustomSelectProps) {
	const selectedOption = options.find((opt) => opt.value === value);

	return (
		<Field.Root className="flex flex-col items-start gap-1 w-full">
			{label && (
				<Field.Label
					className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-default"
					nativeLabel={false}
					render={<div />}
				>
					{label}
					{required && <span className="text-red-500 ml-1">*</span>}
				</Field.Label>
			)}

			<Select.Root
				items={options}
				value={value}
				onValueChange={(newValue) => onChange?.(newValue as string)}
				disabled={disabled}
			>
				<Select.Trigger
					className={`
						cursor-pointer
						box-border
						flex items-center justify-between
						gap-3
						h-10
						pl-3.5 pr-3
						m-0
						outline-none
						border ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}
						rounded-sm
						bg-transparent
						font-normal text-base
						text-gray-900 dark:text-gray-100
						select-none
						min-w-40
						w-full
						hover:bg-gray-100 dark:hover:bg-gray-800
						data-popup-open:bg-gray-100 dark:data-popup-open:bg-gray-800
						focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:-outline-offset-1
						transition-colors
						${className || ''}
					`}
				>
					<Select.Value className="data-placeholder:opacity-60" placeholder={placeholder}>
						{selectedOption?.label || placeholder}
					</Select.Value>

					<Select.Icon className="flex">
						<ChevronUpDownIcon />
					</Select.Icon>
				</Select.Trigger>

				<Select.Portal>
					<Select.Positioner className="outline-none select-none z-1000" sideOffset={8}>
						<Select.Popup
							className="
								box-border
								rounded-sm
								bg-white dark:bg-gray-800
								text-gray-900 dark:text-gray-100
								min-w-(--anchor-width)
								origin-(--transform-origin)
								transition-[transform,opacity] duration-150
								data-starting-style:opacity-0 data-starting-style:scale-90
								data-ending-style:opacity-0 data-ending-style:scale-90
								data-[side=none]:transition-none data-[side=none]:scale-100 data-[side=none]:opacity-100
								data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)]
								shadow-lg
								border border-gray-200 dark:border-gray-700
							"
						>
							<Select.ScrollUpArrow
								className="
									w-full
									bg-white dark:bg-gray-800
									z-10
									text-center
									cursor-default
									rounded-sm
									h-4
									text-xs
									flex items-center justify-center
									relative
									data-[direction=up]:data-[side=none]:before:content-['']
									data-[direction=up]:data-[side=none]:before:absolute
									data-[direction=up]:data-[side=none]:before:w-full
									data-[direction=up]:data-[side=none]:before:h-full
									data-[direction=up]:data-[side=none]:before:-top-full
									data-[direction=up]:data-[side=none]:before:left-0
								"
							>
								▲
							</Select.ScrollUpArrow>

							<Select.List className="box-border relative py-1 overflow-auto max-h-(--available-height) scroll-pb-6">
								{options.map(({ label, value }) => (
									<Select.Item
										key={value}
										value={value}
										className="
											cursor-pointer
											box-border
											outline-none
											text-sm leading-4
											py-2
											pl-2.5 pr-4
											grid grid-cols-[0.75rem_1fr] gap-2 items-center
											select-none
											data-highlighted:z-0
											data-highlighted:relative
											data-highlighted:text-gray-50 dark:data-highlighted:text-gray-900
											data-highlighted:before:content-['']
											data-highlighted:before:absolute
											data-highlighted:before:inset-y-0
											data-highlighted:before:inset-x-1
											data-highlighted:before:rounded-sm
											data-highlighted:before:bg-gray-900 dark:data-highlighted:before:bg-gray-200
											data-highlighted:before:-z-10
											data-[side=none]:text-base
											data-[side=none]:pr-12
										"
									>
										<Select.ItemIndicator className="col-start-1">
											<CheckIcon className="block w-3 h-3" />
										</Select.ItemIndicator>
										<Select.ItemText className="col-start-2">{label}</Select.ItemText>
									</Select.Item>
								))}
							</Select.List>

							<Select.ScrollDownArrow
								className="
									w-full
									bg-white dark:bg-gray-800
									z-10
									text-center
									cursor-default
									rounded-sm
									h-4
									text-xs
									flex items-center justify-center
									absolute bottom-0
									data-[direction=down]:data-[side=none]:before:content-['']
									data-[direction=down]:data-[side=none]:before:absolute
									data-[direction=down]:data-[side=none]:before:w-full
									data-[direction=down]:data-[side=none]:before:h-full
									data-[direction=down]:data-[side=none]:before:-bottom-full
									data-[direction=down]:data-[side=none]:before:left-0
								"
							>
								▼
							</Select.ScrollDownArrow>
						</Select.Popup>
					</Select.Positioner>
				</Select.Portal>
			</Select.Root>

			{error && <p className="text-sm text-red-500">{error}</p>}
		</Field.Root>
	);
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
	return (
		<svg
			width="8"
			height="12"
			viewBox="0 0 8 12"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			{...props}
		>
			<path d="M0.5 4.5L4 1.5L7.5 4.5" />
			<path d="M0.5 7.5L4 10.5L7.5 7.5" />
		</svg>
	);
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
	return (
		<svg fill="currentColor" width="10" height="10" viewBox="0 0 10 10" {...props}>
			<path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
		</svg>
	);
}
