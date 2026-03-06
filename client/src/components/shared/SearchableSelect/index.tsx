// components/ui/Field/SearchableSelect.tsx
import { useState, useEffect, useRef } from 'react';
import { Field } from '@base-ui/react/field';

interface Option {
	id: number;
	name: string;
	[key: string]: any;
}

interface SearchableSelectProps<T extends Option> {
	label: string;
	value?: number | null;
	onChange: (value: number | null) => void;
	options: T[];
	onSearch: (query: string) => void;
	isLoading?: boolean;
	getOptionLabel?: (option: T) => string;
	placeholder?: string;
	error?: string;
	description?: string;
	required?: boolean;
	disabled?: boolean;
}

export function SearchableSelect<T extends Option>({
	label,
	value,
	onChange,
	options,
	onSearch,
	isLoading = false,
	getOptionLabel = (option) => option.name,
	placeholder = 'Поиск...',
	error,
	description,
	required,
	disabled,
}: SearchableSelectProps<T>) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedOption, setSelectedOption] = useState<T | null>(null);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Find selected option by value
	useEffect(() => {
		if (value && options.length > 0) {
			const found = options.find((opt) => opt.id === value);
			if (found) {
				setSelectedOption(found);
				setSearchQuery(getOptionLabel(found));
			}
		} else if (!value) {
			setSelectedOption(null);
			setSearchQuery('');
		}
	}, [value, options, getOptionLabel]);

	// Close on click outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
				if (!selectedOption) {
					setSearchQuery('');
				} else {
					setSearchQuery(getOptionLabel(selectedOption));
				}
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [selectedOption, getOptionLabel]);

	// Keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) {
			if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
				setIsOpen(true);
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
				break;
			case 'ArrowUp':
				e.preventDefault();
				setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
				break;
			case 'Enter':
				e.preventDefault();
				if (highlightedIndex >= 0 && options[highlightedIndex]) {
					handleSelect(options[highlightedIndex]);
				}
				break;
			case 'Escape':
				setIsOpen(false);
				setHighlightedIndex(-1);
				break;
			case 'Tab':
				setIsOpen(false);
				break;
		}
	};

	const handleSelect = (option: T) => {
		setSelectedOption(option);
		setSearchQuery(getOptionLabel(option));
		onChange(option.id);
		setIsOpen(false);
		setHighlightedIndex(-1);
	};

	const handleClear = () => {
		setSelectedOption(null);
		setSearchQuery('');
		onChange(null);
		inputRef.current?.focus();
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const query = e.target.value;
		setSearchQuery(query);
		setIsOpen(true);
		setHighlightedIndex(-1);
		if (selectedOption) {
			setSelectedOption(null);
			onChange(null);
		}
		onSearch(query);
	};

	const handleInputFocus = () => {
		setIsOpen(true);
		if (!selectedOption) {
			setSearchQuery('');
			onSearch('');
		}
	};

	return (
		<Field.Root className="space-y-1">
			<Field.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
				{label} {required && <span className="text-red-500">*</span>}
			</Field.Label>

			<div ref={containerRef} className="relative">
				<div className="relative">
					<input
						ref={inputRef}
						type="text"
						value={searchQuery}
						onChange={handleInputChange}
						onFocus={handleInputFocus}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						disabled={disabled}
						className={`
              w-full px-3 py-2 bg-white dark:bg-black border 
              ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}
              rounded-lg text-gray-900 dark:text-gray-100 
              focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
              disabled:opacity-50 disabled:cursor-not-allowed
              pr-8
            `}
					/>

					{searchQuery && !disabled && (
						<button
							type="button"
							onClick={handleClear}
							className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					)}
				</div>

				{isOpen && (
					<div className="absolute z-10 w-full mt-1 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto">
						{isLoading ? (
							<div className="px-3 py-2 text-gray-500 dark:text-gray-400">Поиск...</div>
						) : options.length === 0 ? (
							<div className="px-3 py-2 text-gray-500 dark:text-gray-400">
								{searchQuery ? 'Ничего не найдено' : 'Введите запрос'}
							</div>
						) : (
							options.map((option, index) => (
								<button
									key={option.id}
									type="button"
									onClick={() => handleSelect(option)}
									onMouseEnter={() => setHighlightedIndex(index)}
									className={`
                    w-full text-left px-3 py-2 cursor-pointer
                    ${
											highlightedIndex === index
												? 'bg-gray-100 dark:bg-gray-800'
												: 'hover:bg-gray-50 dark:hover:bg-gray-900'
										}
                    ${value === option.id ? 'font-medium' : ''}
                    transition-colors
                  `}
								>
									{getOptionLabel(option)}
								</button>
							))
						)}
					</div>
				)}
			</div>

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
