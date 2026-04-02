// client/src/App.tsx
import { useState, memo } from 'react';
import { Outlet } from 'react-router';
import { BurgerMenu } from '@/components/shared/BurgerMenu';

// Отдельный компонент для контента
const Content = memo(({ isMenuOpen }: { isMenuOpen: boolean }) => (
	<main>
		<div
			className={`pt-6 max-w-[90vw] mx-auto p-4 transition-all duration-300 ${isMenuOpen ? 'blur-sm' : ''}`}
		>
			<Outlet />
		</div>
	</main>
));

export default function App() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
			<BurgerMenu
				isOpen={isMenuOpen}
				onClose={() => setIsMenuOpen(false)}
				onToggle={() => setIsMenuOpen((prev) => !prev)}
			/>

			<Content isMenuOpen={isMenuOpen} />
		</div>
	);
}
