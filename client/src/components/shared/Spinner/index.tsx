// components/Spinner.tsx
import { useEffect, useState } from 'react';

interface SpinnerProps {
	size?: 'sm' | 'md' | 'lg';
	fullScreen?: boolean;
	blur?: boolean;
	className?: string;
	show?: boolean; // для управления видимостью
	fadeIn?: boolean; // включить плавное появление
	delay?: number; // задержка перед показом спиннера (мс)
	blurDelay?: number; // задержка перед показом блюра (мс)
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
	show = true,
	fadeIn = true,
	delay = 2000, // спиннер появляется через 2 секунды
	blurDelay = 0, // блюр появляется сразу
}: SpinnerProps) {
	const [showBlur, setShowBlur] = useState(false);
	const [showSpinner, setShowSpinner] = useState(false);
	const [shouldRender, setShouldRender] = useState(false);

	useEffect(() => {
		let blurTimer: ReturnType<typeof setTimeout>;
		let spinnerTimer: ReturnType<typeof setTimeout>;
		let hideTimer: ReturnType<typeof setTimeout>;

		if (show) {
			// Сначала показываем блюр
			blurTimer = setTimeout(() => {
				setShowBlur(true);
				setShouldRender(true);
			}, blurDelay);

			// Потом спиннер
			spinnerTimer = setTimeout(() => {
				setShowSpinner(true);
			}, delay);
		} else {
			if (fadeIn) {
				// Скрываем спиннер
				setShowSpinner(false);
				// Потом блюр
				setShowBlur(false);
				// Потом убираем из DOM
				hideTimer = setTimeout(() => {
					setShouldRender(false);
				}, 300);
			} else {
				setShouldRender(false);
			}
		}

		return () => {
			clearTimeout(blurTimer);
			clearTimeout(spinnerTimer);
			clearTimeout(hideTimer);
		};
	}, [show, blurDelay, delay, fadeIn]);

	if (!shouldRender) return null;

	const spinner = (
		<div
			className={`
        ${sizeClasses[size]}
        rounded-full
        border-primary-200 dark:border-primary-800
        border-t-primary-600 dark:border-t-primary-400
        animate-spin
        transition-all duration-300
        ${!showSpinner ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}
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
          transition-all duration-500
          ${
						blur
							? showBlur
								? 'backdrop-blur-sm bg-white/30 dark:bg-gray-900/30'
								: 'backdrop-blur-0 bg-transparent'
							: showBlur
								? 'bg-white/80 dark:bg-gray-900/80'
								: 'bg-transparent'
					}
        `}
			>
				{spinner}
			</div>
		);
	}

	return spinner;
}
