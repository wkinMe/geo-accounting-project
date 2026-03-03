// components/shared/CloseBtn.tsx
import type { ButtonHTMLAttributes } from 'react';

interface CloseBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	size?: 'sm' | 'md' | 'lg';
	variant?: 'default' | 'rounded' | 'circle';
	colorScheme?: 'gray' | 'primary' | 'white' | 'black';
	className?: string;
}

const sizeClasses = {
	sm: 'w-6 h-6',
	md: 'w-8 h-8',
	lg: 'w-10 h-10',
};

const iconSizes = {
	sm: 'w-3 h-3',
	md: 'w-4 h-4',
	lg: 'w-5 h-5',
};

const variantClasses = {
	default: 'rounded-md',
	rounded: 'rounded-lg',
	circle: 'rounded-full',
};

const colorSchemes = {
	gray: `
    text-gray-500 hover:text-gray-700
    dark:text-gray-400 dark:hover:text-gray-300
    hover:bg-gray-100 dark:hover:bg-gray-700
  `,
	primary: `
    text-primary-600 hover:text-primary-700
    dark:text-primary-400 dark:hover:text-primary-300
    hover:bg-primary-50 dark:hover:bg-primary-900/20
  `,
	white: `
    text-white hover:text-gray-200
    hover:bg-white/20
  `,
	black: `
    text-gray-900 hover:text-gray-700
    dark:text-white dark:hover:text-gray-300
    hover:bg-gray-100 dark:hover:bg-gray-800
  `,
};

export default function CloseBtn({
	size = 'md',
	variant = 'default',
	colorScheme = 'gray',
	className = '',
	...props
}: CloseBtnProps) {
	return (
		<button
			type="button"
			className={`
        cursor-pointer
        inline-flex items-center justify-center
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${colorSchemes[colorScheme]}
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
        transition-colors
        ${className}
      `}
			{...props}
		>
			<svg
				className={iconSizes[size]}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>
	);
}
