import { userService } from '@/services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router';
import Input from '@/components/shared/Input';
import Spinner from '@/components/shared/Spinner';
import { Button } from '@base-ui/react/button';

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
		return <Navigate to={from} replace />;
	}

	// Форма логина для неавторизованных пользователей
	return (
		<div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
			<div className="relative">
				{/* Спиннер поверх формы во время отправки */}
				{isPending && (
					<div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-white/50 dark:bg-black/50 rounded-lg z-10">
						<Spinner />
					</div>
				)}

				<form
					onSubmit={handleSubmit}
					className="bg-white dark:bg-black p-8 rounded-lg shadow-xl w-96 border border-gray-200 dark:border-gray-800"
				>
					<h2 className="text-2xl font-bold mb-6 text-center text-black dark:text-white">
						Вход в систему
					</h2>

					<div className="mb-4">
						<label className="block text-gray-600 dark:text-gray-400 text-sm font-bold mb-2">
							Имя пользователя
						</label>
						<Input
							placeholder="Введите своё имя"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							disabled={isPending}
							className="border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-white"
						/>
					</div>

					<div className="mb-6">
						<label className="block text-gray-600 dark:text-gray-400 text-sm font-bold mb-2">
							Пароль
						</label>
						<Input
							placeholder="Введите пароль"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={isPending}
							className="border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-white"
						/>
					</div>

					<Button
						type="submit"
						disabled={isPending}
						className="w-full bg-black dark:bg-white cursor-pointer hover:opacity-80 text-white dark:text-black py-2 px-4 rounded-lg transition-opacity disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-400"
					>
						{isPending ? 'Вход...' : 'Войти'}
					</Button>
				</form>
			</div>
		</div>
	);
}
