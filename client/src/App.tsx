import { useQuery } from '@tanstack/react-query';
import { userService } from './services';
import { Link, Outlet, useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Spinner from './components/shared/Spinner';
import { ConfirmedModal } from './components/shared/ConfirmModal';
import { useState } from 'react';

function App() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [isModalOpen, setIsModalOpen] = useState(false);

	const { data: profile, isLoading } = useQuery({
		queryKey: ['profile'],
		queryFn: () => userService.getProfile(),
		retry: false,
	});

	const { mutate: logout } = useMutation({
		mutationFn: () => userService.logout(),
		onSuccess: () => {
			localStorage.removeItem('token');
			queryClient.clear();
			queryClient.removeQueries({ queryKey: ['profile'] });
			navigate('/login');
		},
	});

	if (isLoading) {
		return <Spinner fullScreen blur />;
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			{/* Навигационная панель */}
			<nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex items-center space-x-8">
							{/* Логотип */}
							<div className="flex-shrink-0">
								<Link to="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
									Logistics Pro
								</Link>
							</div>

							{/* Навигационные ссылки */}
							<div className="hidden sm:flex sm:space-x-8">
								<Link
									to="/warehouses"
									className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 border-b-2 border-transparent hover:border-primary-500 transition-colors"
								>
									Склады
								</Link>
								<Link
									to="/managers"
									className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 border-b-2 border-transparent hover:border-primary-500 transition-colors"
								>
									Менеджеры
								</Link>
								<Link
									to="/reports"
									className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 border-b-2 border-transparent hover:border-primary-500 transition-colors"
								>
									Отчеты
								</Link>
							</div>
						</div>

						{/* Профиль и выход */}
						<div className="flex items-center space-x-4">
							{/* Кнопка для открытия модалки */}
							<button
								onClick={() => setIsModalOpen(true)}
								className="inline-flex items-center px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors mr-2"
							>
								<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								Тест модалки
							</button>

							<div className="text-sm text-gray-700 dark:text-gray-300">
								<span className="font-medium">{profile?.data?.name}</span>
							</div>
							<button
								onClick={() => logout()}
								className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
							>
								<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
									/>
								</svg>
								Выйти
							</button>
						</div>
					</div>
				</div>
			</nav>
			{/* Основной контент */}
			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				{/* Добавим карточку для теста модалки */}
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
						Тестирование модального окна
					</h2>
					<p className="text-gray-600 dark:text-gray-400 mb-4">
						Нажмите на кнопку "Тест модалки" в навбаре или на кнопку ниже, чтобы открыть модальное
						окно подтверждения.
					</p>
					<button
						onClick={() => setIsModalOpen(true)}
						className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
					>
						Открыть модальное окно
					</button>
				</div>

				{/* Здесь будет отображаться содержимое дочерних маршрутов */}
				<Outlet />
			</main>
			{/* Модальное окно */}
			<ConfirmedModal
				open={isModalOpen}
				setOpen={setIsModalOpen}
				actionName="Тестовое действие"
				onConfirm={() => {
					return new Promise((resolve) => {
						// Имитация асинхронного действия (например, запроса к API)
						setTimeout(() => {
							console.log('Действие подтверждено!');
							resolve();
						}, 2000);
					});
				}}
				confirmText="Да, подтвердить"
				cancelText="Нет, отмена"
				// isDestructive={true} // Раскомментируйте для опасного действия (красная кнопка)
			>
				<div className="space-y-4">
					<p className="text-gray-600 dark:text-gray-400">
						Это тестовое модальное окно подтверждения. Здесь можно проверить:
					</p>
					<ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
						<li>Кнопку закрытия (крестик) справа вверху</li>
						<li>Заголовок с отступом от крестика</li>
						<li>Затемнение фона (backdrop)</li>
						<li>Анимации открытия/закрытия</li>
						<li>Кнопку подтверждения с загрузкой</li>
						<li>Разные стили для опасных действий</li>
					</ul>
					<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
						<p className="text-yellow-800 dark:text-yellow-300 text-sm">
							⏳ Кнопка подтверждения имитирует загрузку 2 секунды. Попробуйте нажать!
						</p>
					</div>
				</div>
			</ConfirmedModal>
		</div>
	);
}

export default App;
