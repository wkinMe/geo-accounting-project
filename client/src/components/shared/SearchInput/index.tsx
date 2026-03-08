import { useEffect, useState } from 'react';
import { IoIosSearch } from 'react-icons/io';
import Input from '../Input';
import type { InputProps } from '@base-ui/react';

interface Props extends InputProps {
	value: string;
	ms: number; // debounce ms delay
	placeholder?: string;
	onSearch: (query: string) => void;
}

export function SearchInput({ value, ms, placeholder = 'Поиск', onSearch, ...props }: Props) {
	const [localValue, setLocalValue] = useState(value);

	useEffect(() => {
		let timer = setTimeout(() => {
			onSearch(localValue);
		}, ms);

		return () => {
			clearTimeout(timer);
		};
	}, [localValue, ms]);

	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	return (
		<div className={`flex items-center gap-3 ${props.className}`}>
			<Input
				startIcon={<IoIosSearch />}
				onChange={(e) => setLocalValue(e.currentTarget.value)}
				placeholder={placeholder}
			/>
		</div>
	);
}
