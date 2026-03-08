'use client';
import * as React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import type { ButtonProps as BaseButtonProps } from '@base-ui/react/button';

interface ButtonProps extends BaseButtonProps {
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
	size?: 'sm' | 'md' | 'lg';
	startIcon?: React.ReactElement;
	endIcon?: React.ReactElement;
	fullWidth?: boolean;
	loading?: boolean;
	children?: React.ReactNode;
}

export function Button({
	children,
	variant = 'primary',
	size = 'md',
	startIcon,
	endIcon,
	fullWidth,
	loading,
	className = '',
	disabled,
	...props
}: ButtonProps) {
	const variants = {
		primary: `
      bg-gray-900 dark:bg-gray-100
      text-white dark:text-gray-900
      hover:bg-gray-800 dark:hover:bg-gray-200
      border border-transparent
    `,
		secondary: `
      bg-gray-100 dark:bg-gray-800
      text-gray-900 dark:text-gray-100
      hover:bg-gray-200 dark:hover:bg-gray-700
      border border-transparent
    `,
		outline: `
      bg-transparent
      text-gray-900 dark:text-gray-100
      hover:bg-gray-50 dark:hover:bg-gray-900
      border border-gray-200 dark:border-gray-700
    `,
		ghost: `
      bg-transparent
      text-gray-600 dark:text-gray-400
      hover:text-gray-900 dark:hover:text-gray-100
      hover:bg-gray-50 dark:hover:bg-gray-900
      border border-transparent
    `,
	};

	const sizes = {
		sm: 'h-8 px-3 text-sm',
		md: 'h-10 px-4',
		lg: 'h-12 px-6 text-lg',
	};

	const width = fullWidth ? 'w-full' : '';
	const isDisabled = disabled || loading;

	return (
		<BaseButton
			className={`
        inline-flex items-center justify-center gap-2
        font-normal text-base
        rounded-sm
        transition-all duration-200
        focus:outline-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${width}
        ${loading ? 'cursor-wait' : ''}
        ${className}
      `}
			disabled={isDisabled}
			focusableWhenDisabled
			{...props}
		>
			{loading && (
				<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
					<circle
						className="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						strokeWidth="4"
						fill="none"
					/>
					<path
						className="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					/>
				</svg>
			)}

			{!loading && startIcon && <span className="shrink-0">{startIcon}</span>}
			{children}
			{!loading && endIcon && <span className="shrink-0">{endIcon}</span>}
		</BaseButton>
	);
}
