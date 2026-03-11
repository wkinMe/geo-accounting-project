// client/src/App.tsx
import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router';
import {
	FaBars,
	FaTimes,
	FaWarehouse,
	FaUsers,
	FaFileAlt,
	FaHome,
	FaSignOutAlt,
} from 'react-icons/fa';
import { userService } from '@/services/userService';

export default function App() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const navigate = useNavigate();

	const handleLogout = async () => {
		try {
			await userService.logout();
			navigate('/login');
		} catch (error) {
			console.error('Logout error:', error);
		}
	};

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setIsMenuOpen((prev) => !prev);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	const menuItems = [
		{ path: '/', label: 'Главная', icon: <FaHome /> },
		{ path: '/warehouses', label: 'Склады', icon: <FaWarehouse /> },
		{ path: '/users', label: 'Пользователи', icon: <FaUsers /> },
		{ path: '/reports', label: 'Отчёты', icon: <FaFileAlt /> },
	];

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
			{/* Кнопка бургер-меню */}
			<button
				onClick={() => setIsMenuOpen(!isMenuOpen)}
				className="fixed top-4 left-4 z-50 p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none cursor-pointer"
			>
				{isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
			</button>

			{/* Затемнение и блюр основного контента при открытом меню */}
			{isMenuOpen && (
				<div
					className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-all duration-300 cursor-pointer"
					onClick={() => setIsMenuOpen(false)}
				/>
			)}

			{/* Бургер-меню */}
			<div
				className={`
					fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-50
					transform transition-transform duration-300 ease-in-out
					${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
				`}
			>
				{/* Заголовок меню */}
				<div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-lg font-semibold text-gray-800 dark:text-white">Меню</h2>
				</div>

				{/* Список навигации */}
				<nav className="p-4 h-[calc(100%-4rem)]">
					<ul className="space-y-2">
						{menuItems.map((item) => (
							<li key={item.path}>
								<Link
									to={item.path}
									onClick={() => setIsMenuOpen(false)}
									className="
										flex items-center gap-3 px-4 py-3 w-full
										text-gray-700 dark:text-gray-300
										rounded-md
										hover:bg-gray-100 dark:hover:bg-gray-700
										transition-colors
										cursor-pointer
									"
								>
									<span className="text-lg">{item.icon}</span>
									<span>{item.label}</span>
								</Link>
							</li>
						))}
					</ul>

					{/* Кнопка выхода */}
					<div className="absolute bottom-4 left-0 right-0 px-4">
						<button
							onClick={handleLogout}
							className="
								flex items-center gap-3 px-4 py-3 w-full
								text-red-600 dark:text-red-400
								rounded-md
								hover:bg-red-50 dark:hover:bg-red-900/20
								transition-colors
								cursor-pointer
							"
						>
							<FaSignOutAlt className="text-lg" />
							<span>Выйти</span>
						</button>
					</div>
				</nav>
			</div>

			{/* Основной контент */}
			<main className={`min-h-screen transition-all duration-300 ${isMenuOpen ? 'blur-sm' : ''}`}>
				<div className="pt-6 max-w-7xl mx-auto p-4">
					<Outlet />
				</div>
			</main>
		</div>
	);
}
