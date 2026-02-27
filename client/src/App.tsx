import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from './services';
import { useState } from 'react';
import Input from './components/Input';

function App() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const queryClient = useQueryClient();

	const { data: profile, isLoading } = useQuery({
		queryKey: ['profile'],
		queryFn: () => userService.getProfile(),
		retry: false,
	});

	const { mutate: login, isPending } = useMutation({
		mutationFn: () => userService.login({ name: username, password }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['profile'] });
			setUsername('');
			setPassword('');
		},
	});

	const { mutate: logout } = useMutation({
		mutationFn: () => userService.logout(),
		onSuccess: () => {
			localStorage.removeItem('token');
			queryClient.invalidateQueries({ queryKey: ['profile'] });
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (username && password) {
			login();
		}
	};

	// Показываем загрузку
	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-gray-500">Загрузка...</div>
			</div>
		);
	}

	// Если пользователь авторизован
	if (profile?.data) {
		return (
			<div className="min-h-screen bg-gray-50">
				{/* Кнопка logout справа вверху */}
				<div className="absolute top-4 right-4">
					<button
						onClick={() => logout()}
						className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
					>
						Выйти
					</button>
				</div>

				{/* Имя пользователя по центру */}
				<div className="min-h-screen flex items-center justify-center">
					<h1 className="text-4xl font-bold text-gray-800">{profile.data.name}</h1>
				</div>
			</div>
		);
	}

	// Форма логина (если не авторизован)
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
				<h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Вход в систему</h2>

				<div className="mb-4">
					<label className="block text-gray-700 text-sm font-bold mb-2">Имя пользователя</label>
					<Input
						placeholder="Введите своё имя"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						disabled={isPending}
					/>
				</div>

				<div className="mb-6">
					<label className="block text-gray-700 text-sm font-bold mb-2">Пароль</label>
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
					className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
				>
					{isPending ? 'Вход...' : 'Войти'}
				</button>
			</form>
		</div>
	);
}

export default App;
