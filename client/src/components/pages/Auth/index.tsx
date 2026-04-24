// client/src/components/pages/Auth.tsx
import { userService } from '@/services';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation, Link } from 'react-router';
import Input from '@/components/shared/Input';
import Spinner from '@/components/shared/Spinner';
import { Button } from '@base-ui/react/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AxiosError } from 'axios';
import { useEffect } from 'react';

const loginSchema = z.object({
	username: z.string().min(1, 'Имя пользователя обязательно'),
	password: z.string().min(1, 'Пароль обязателен'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface ErrorResponse {
	message: string;
}

export function Auth() {
	const navigate = useNavigate();
	const location = useLocation();
	const queryClient = useQueryClient();

	const from = location.state?.from?.pathname || '/';
	const token = localStorage.getItem('token');

	useEffect(() => {
		if (token) {
			userService
				.getProfile()
				.then(() => {
					navigate(from, { replace: true });
				})
				.catch(() => {
					localStorage.removeItem('token');
				});
		}
	}, [token, navigate, from]);

	const {
		register,
		handleSubmit,
		setError,
		clearErrors,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			username: '',
			password: '',
		},
	});

	const { mutate: login, isPending } = useMutation({
		mutationFn: (data: LoginFormData) =>
			userService.login({ name: data.username, password: data.password }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['profile'] });
			navigate(from, { replace: true });
		},
		onError: (error: AxiosError<ErrorResponse>) => {
			const message = error.response?.data?.message;
			if (message === 'Invalid name or password') {
				setError('root', {
					type: 'manual',
					message: 'Неверное имя пользователя или пароль',
				});
			} else {
				setError('root', {
					type: 'manual',
					message: 'Ошибка при входе. Попробуйте позже.',
				});
			}
		},
	});

	const onSubmit = (data: LoginFormData) => {
		clearErrors('root');
		login(data);
	};

	const onFieldChange = () => {
		if (errors.root) {
			clearErrors('root');
		}
	};

	if (token && !localStorage.getItem('auth_checked')) {
		localStorage.setItem('auth_checked', 'true');
		return <Spinner fullScreen blur show={true} />;
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
			<div className="relative w-96">
				{isPending && (
					<div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-white/50 dark:bg-black/50 rounded-lg z-10">
						<Spinner />
					</div>
				)}

				<form
					onSubmit={handleSubmit(onSubmit)}
					className="bg-white dark:bg-black p-8 rounded-lg shadow-xl w-full border border-gray-200 dark:border-gray-800"
				>
					<h2 className="text-2xl font-bold mb-6 text-center text-black dark:text-white">
						Вход в систему
					</h2>

					{errors.root && (
						<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
							❌ {errors.root.message}
						</div>
					)}

					<div className="mb-4">
						<label className="block text-gray-600 dark:text-gray-400 text-sm font-bold mb-2">
							Имя пользователя
						</label>
						<Input
							placeholder="Введите своё имя"
							{...register('username')}
							onChange={(e) => {
								register('username').onChange(e);
								onFieldChange();
							}}
							disabled={isPending}
							className={`border ${
								errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
							} focus:border-black dark:focus:border-white`}
						/>
						{errors.username && (
							<p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
						)}
					</div>

					<div className="mb-6">
						<label className="block text-gray-600 dark:text-gray-400 text-sm font-bold mb-2">
							Пароль
						</label>
						<Input
							placeholder="Введите пароль"
							type="password"
							{...register('password')}
							onChange={(e) => {
								register('password').onChange(e);
								onFieldChange();
							}}
							disabled={isPending}
							className={`border ${
								errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
							} focus:border-black dark:focus:border-white`}
						/>
						{errors.password && (
							<p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
						)}
					</div>

					<Button
						type="submit"
						disabled={isPending}
						className="w-full bg-black dark:bg-white cursor-pointer hover:opacity-80 text-white dark:text-black py-2 px-4 rounded-lg transition-opacity disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-400"
					>
						{isPending ? 'Вход...' : 'Войти'}
					</Button>
				</form>

				<div className="mt-4 text-center">
					<Link
						to="/register"
						className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
					>
						Нет аккаунта? Зарегистрироваться
					</Link>
				</div>
			</div>	
		</div>
	);
}
