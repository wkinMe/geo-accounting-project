// components/Spinner.tsx
interface SpinnerProps {
	size?: 'sm' | 'md' | 'lg';
	fullScreen?: boolean;
	blur?: boolean;
	className?: string;
}

const sizeClasses = {
	sm: 'w-6 h-6 border-2',
	md: 'w-10 h-10 border-3',
	lg: 'w-16 h-16 border-4',
};

export default function Spinner({
	size = 'md',
	fullScreen = false,
	blur = true,
	className = '',
}: SpinnerProps) {
	const spinner = (
		<div
			className={`
        ${sizeClasses[size]}
        rounded-full
        border-primary-200 dark:border-primary-800
        border-t-primary-600 dark:border-t-primary-400
        animate-spin
        transition-all
        ${className}
      `}
		/>
	);

	if (fullScreen) {
		return (
			<div
				className={`
          fixed inset-0 z-50
          flex items-center justify-center
          ${
						blur
							? 'backdrop-blur-sm bg-white/30 dark:bg-gray-900/30'
							: 'bg-white/80 dark:bg-gray-900/80'
					}
          transition-all
        `}
			>
				{spinner}
			</div>
		);
	}

	return spinner;
}
