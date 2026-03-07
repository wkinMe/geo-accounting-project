import axios from 'axios';

export const instance = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	withCredentials: true,
});

instance.interceptors.request.use((config) => {
	config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
	return config;
});

instance.interceptors.response.use(
	(response) => {
		return response;
	},
	async (error) => {
		const originalResponse = error.config;
		if (error?.response?.status === 401) {
			try {
				const response = await axios.post(
					`${import.meta.env.VITE_API_URL}/users/refresh`,
					{},
					{
						withCredentials: true,
					}
				);

				if (response.status === 200 && response.data.data.tokens.accessToken) {
					originalResponse.headers.Authorization = `Bearer ${response.data.data.tokens.accessToken}`;
					localStorage.setItem(`token`, response.data.data.tokens.accessToken);
					return instance.request(originalResponse);
				}
			} catch (e) {
				// Если обновление токена не удалось, выбрасываем ошибку авторизации
				return Promise.reject(new Error('Не авторизован'));
			}
		}
		return Promise.reject(error);
	}
);
