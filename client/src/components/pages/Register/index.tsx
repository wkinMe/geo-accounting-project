// client/src/components/pages/Register.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { organizationService } from '@/services/organizationService';
import { useQuery } from '@tanstack/react-query';
import Input from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import type { AxiosError } from 'axios';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { USER_ROLES } from '@/constants';

const registerSchema = z.object({
	name: z.string().min(1, 'Имя пользователя обязательно'),
	password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
	organization_id: z.number({ error: 'Выберите организацию' }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface ErrorResponse {
	message: string;
}

export function Register() {
	const navigate = useNavigate();
	const [orgSearchQuery, setOrgSearchQuery] = useState('');
	const [serverError, setServerError] = useState<string | null>(null);

	const {
		control,
		handleSubmit,
		formState: { errors },
		clearErrors,
		setError,
	} = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			name: '',
			password: '',
			organization_id: undefined,
		},
	});

	// Запросы для организаций
	const { data: organizations, isLoading: isLoadingOrgs } = useQuery({
		queryKey: ['organizations'],
		queryFn: () => organizationService.findAll(),
	});

	const { data: searchedOrgs, isLoading: isSearchingOrgs } = useQuery({
		queryKey: ['organizations', 'search', orgSearchQuery],
		queryFn: () => organizationService.search(orgSearchQuery),
		enabled: orgSearchQuery.length > 0,
	});

	const { mutate: register, isPending } = useMutation({
		mutationFn: (data: RegisterFormData) =>
			userService.register({
				name: data.name,
				password: data.password,
				organization_id: data.organization_id,
				role: USER_ROLES.USER,
			}),
		onSuccess: () => {
			navigate('/login', { replace: true });
		},
		onError: (error: AxiosError<ErrorResponse>) => {
			const message = error.response?.data?.message;

			if (message?.includes('already exists')) {
				setError('name', {
					type: 'manual',
					message: 'Пользователь с таким именем уже существует',
				});
			} else {
				setServerError(message || 'Ошибка при регистрации');
			}
		},
	});

	const onSubmit = (data: RegisterFormData) => {
		setServerError(null);
		clearErrors();
		register(data);
	};

	// Очищаем ошибку при изменении полей
	const onFieldChange = () => {
		if (serverError) {
			setServerError(null);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
			<div className="relative w-96">
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="bg-white dark:bg-black p-8 rounded-lg shadow-xl w-full border border-gray-200 dark:border-gray-800"
				>
					<h2 className="text-2xl font-bold mb-6 text-center text-black dark:text-white">
						Регистрация
					</h2>

					{serverError && (
						<div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
							<p className="text-sm text-red-600 dark:text-red-400 text-center">{serverError}</p>
						</div>
					)}

					<div className="mb-4">
						<label className="block text-gray-600 dark:text-gray-400 text-sm font-bold mb-2">
							Имя пользователя
						</label>
						<Controller
							name="name"
							control={control}
							render={({ field }) => (
								<Input
									placeholder="Введите имя"
									value={field.value}
									onChange={(e) => {
										field.onChange(e);
										onFieldChange();
									}}
									disabled={isPending}
									className={`border ${
										errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
									} focus:border-black dark:focus:border-white`}
								/>
							)}
						/>
						{errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
					</div>

					<div className="mb-4">
						<label className="block text-gray-600 dark:text-gray-400 text-sm font-bold mb-2">
							Пароль
						</label>
						<Controller
							name="password"
							control={control}
							render={({ field }) => (
								<Input
									type="password"
									placeholder="Введите пароль"
									value={field.value}
									onChange={(e) => {
										field.onChange(e);
										onFieldChange();
									}}
									disabled={isPending}
									className={`border ${
										errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
									} focus:border-black dark:focus:border-white`}
								/>
							)}
						/>
						{errors.password && (
							<p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
						)}
					</div>

					<div className="mb-6">
						<Controller
							name="organization_id"
							control={control}
							render={({ field }) => (
								<SearchableSelect
									label="Организация"
									value={field.value}
									onChange={(id) => {
										field.onChange(id);
										onFieldChange();
									}}
									options={orgSearchQuery ? searchedOrgs?.data || [] : organizations?.data || []}
									onSearch={setOrgSearchQuery}
									getOptionLabel={(org) => org.name}
									placeholder="Поиск организации..."
									isLoading={isLoadingOrgs || isSearchingOrgs}
									error={errors.organization_id?.message}
									required
								/>
							)}
						/>
					</div>

					<Button
						type="submit"
						disabled={isPending}
						className="w-full bg-black dark:bg-white text-white dark:text-black py-2 px-4 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mb-3"
					>
						{isPending ? 'Регистрация...' : 'Зарегистрироваться'}
					</Button>

					<div className="text-center">
						<Link
							to="/login"
							className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
						>
							Уже есть аккаунт? Войти
						</Link>
					</div>
				</form>

				<div className="mt-4 text-center">
					<Link
						to="/login"
						className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
					>
						Уже есть аккаунт? Войти
					</Link>
				</div>
			</div>
		</div>
	);
}
