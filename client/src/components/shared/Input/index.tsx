import type { InputProps } from '@base-ui/react';
import { Input as BaseInput } from '@base-ui/react';

export default function Input(props: InputProps) {
	return (
		<BaseInput
			{...props}
			className={`
        w-full h-10
        px-3
        border border-gray-200 dark:border-gray-700
        rounded-sm
        font-normal text-base
        bg-transparent
        text-gray-900 dark:text-gray-100
        focus:outline-none 
        disabled:opacity-50 disabled:cursor-not-allowed
        placeholder:text-gray-400 dark:placeholder:text-gray-500
        transition-colors
        ${props.className || ''}
      `}
		/>
	);
}
