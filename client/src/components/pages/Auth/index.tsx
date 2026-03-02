import { userService } from '@/services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router';
import Input from '@/components/shared/Input';
import Spinner from '@/components/shared/Spinner';

export function Auth() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const navigate = useNavigate();
	const location = useLocation();
	const queryClient = useQueryClient();

	// Получаем путь, с которого пришли, или '/' по умолчанию
	const from = location.state?.from?.pathname || '/';

	const {
		data: profile,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['profile'],
		queryFn: () => userService.getProfile(),
		retry: false,
		// Не используем кеш для этого запроса на странице логина
		staleTime: 0,
		gcTime: 0,
	});

	const { mutate: login, isPending } = useMutation({
		mutationFn: () => userService.login({ name: username, password }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['profile'] });
			setUsername('');
			setPassword('');
			// Редирект на страницу, с которой пришли, или на главную
			navigate(from, { replace: true });
		},
		onError: (error) => {
			console.error('Login failed:', error);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (username && password) {
			login();
		}
	};

	// Показываем спиннер во время загрузки профиля
	if (isLoading) {
		return <Spinner fullScreen blur />;
	}

	// Если пользователь уже авторизован - редиректим
	if (profile?.data) {
		console.log('Проходит дата');
		return <Navigate to={from} replace />;
	}

	// Форма логина для неавторизованных пользователей
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
			<div className="relative">
				{/* Спиннер поверх формы во время отправки */}
				{isPending && (
					<div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 rounded-lg z-10">
						<Spinner />
					</div>
				)}

				<form
					onSubmit={handleSubmit}
					className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96"
				>
					<h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
						Вход в систему
					</h2>

					<div className="mb-4">
						<label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
							Имя пользователя
						</label>
						<Input
							placeholder="Введите своё имя"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							disabled={isPending}
						/>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
							Пароль
						</label>
						<Input
							placeholder="Введите пароль"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={isPending}
						/>
					</div>

					<button
						type="submit"
						disabled={isPending || !username || !password}
						className="w-full bg-black cursor-pointer hover:opacity-90 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-opacity disabled:bg-primary-300 disabled:cursor-not-allowed"
					>
						{isPending ? 'Вход...' : 'Войти'}
					</button>
				</form>
			</div>
		</div>
	);
}
