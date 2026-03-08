import { useEffect, useState } from 'react';
import { IoIosSearch } from 'react-icons/io';
import Input from '../Input';

interface Props {
	value: string;
	ms: number; // debounce ms delay
	onSearch: (query: string) => void;
}

export function SearchInput({ value, ms, onSearch }: Props) {
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
		<div className="flex items-center gap-3">
			<IoIosSearch />
			<Input onChange={(e) => setLocalValue(e.currentTarget.value)} />
		</div>
	);
}
