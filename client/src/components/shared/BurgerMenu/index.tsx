// client/src/components/shared/BurgerMenu.tsx
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
	FaBars,
	FaTimes,
	FaWarehouse,
	FaUsers,
	FaSignOutAlt,
	FaFileContract,
	FaBuilding,
	FaBoxOpen,
} from 'react-icons/fa';
import { userService } from '@/services/userService';
import { useRole } from '@/hooks';
import { type UserRole } from '@shared/models';
import { USER_ROLES, USER_ROLES_MAP } from '@shared/constants';

interface MenuItem {
	path: string;
	label: string;
	icon: React.ReactNode;
	allowedRoles?: UserRole[]; // Если не указано - доступно всем
}

interface BurgerMenuProps {
	isOpen: boolean;
	onClose: () => void;
	onToggle: () => void;
}

export function BurgerMenu({ isOpen, onClose, onToggle }: BurgerMenuProps) {
	const navigate = useNavigate();
	const userRole = useRole();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, onClose]);

	const handleLogout = async () => {
		try {
			await userService.logout();
			window.location.href = '/login';
		} catch (error) {
			console.error('Logout error:', error);
			localStorage.clear();
			navigate('/login', { replace: true });
		}
	};

	const menuItems: MenuItem[] = [
		{ path: '/warehouses', label: 'Склады', icon: <FaWarehouse /> },
		{
			path: '/agreements',
			label: 'Договоры',
			icon: <FaFileContract />,
			allowedRoles: [USER_ROLES.MANAGER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
		},
		{ path: '/organizations', label: 'Организации', icon: <FaBuilding /> },
		{ path: '/materials', label: 'Материалы', icon: <FaBoxOpen /> },
		{
			path: '/users',
			label: 'Пользователи',
			icon: <FaUsers />,
			allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
		},
	];

	// Фильтруем пункты меню по роли
	const visibleMenuItems = menuItems.filter((item) => {
		if (!item.allowedRoles) return true; // Склады, организации, материалы доступны всем
		if (!userRole) return false;
		return item.allowedRoles.includes(userRole);
	});

	return (
		<>
			{/* Кнопка бургер-меню */}
			<button
				onClick={onToggle}
				className="fixed top-4 left-4 z-50 p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none cursor-pointer"
				aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
			>
				{isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
			</button>

			{/* Затемнение и блюр основного контента при открытом меню */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-all duration-300 cursor-pointer"
					onClick={onClose}
				/>
			)}

			{/* Бургер-меню */}
			<div
				className={`
					fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-50
					transform transition-transform duration-300 ease-in-out
					${isOpen ? 'translate-x-0' : '-translate-x-full'}
				`}
			>
				{/* Заголовок меню */}
				<div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-lg font-semibold text-gray-800 dark:text-white">Меню</h2>
					{userRole && (
						<span className="ml-auto text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
							{USER_ROLES_MAP[userRole]}
						</span>
					)}
				</div>

				{/* Список навигации */}
				<nav className="p-4 h-[calc(100%-4rem)]">
					<ul className="space-y-2">
						{visibleMenuItems.map((item) => (
							<li key={item.path}>
								<Link
									to={item.path}
									onClick={onClose}
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
		</>
	);
}
