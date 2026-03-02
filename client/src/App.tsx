import { useQuery } from '@tanstack/react-query';
import { userService } from './services';
import { Link, Outlet, useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Spinner from './components/shared/Spinner';

function App() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: profile, isLoading } = useQuery({
		queryKey: ['profile'],
		queryFn: () => userService.getProfile(),
		retry: false,
	});

	const { mutate: logout } = useMutation({
		mutationFn: () => userService.logout(),
		onSuccess: () => {
			localStorage.removeItem('token');
			// Очищаем весь кеш, а не только инвалидируем
			queryClient.clear();
			// Также можно удалить конкретный ключ
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
				<Outlet />
			</main>
		</div>
	);
}

export default App;
