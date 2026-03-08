import type { InputProps as BaseInputProps } from '@base-ui/react';
import { Input as BaseInput } from '@base-ui/react';
interface InputProps extends BaseInputProps {
	startIcon?: React.ReactElement; // Иконка в начале
	endIcon?: React.ReactElement; // Иконка в конце (опционально)
}

export default function Input({ startIcon, endIcon, ...props }: InputProps) {
	return (
		<div className={`relative w-full`}>
			{startIcon && (
				<div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{startIcon}</div>
			)}

			<BaseInput
				{...props}
				className={`
          w-full h-10
          ${startIcon ? 'pl-10' : 'px-3'}  // Отступ слева если есть иконка
          ${endIcon ? 'pr-10' : 'px-3'}     // Отступ справа если есть иконка
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

			{endIcon && (
				<div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{endIcon}</div>
			)}
		</div>
	);
}
