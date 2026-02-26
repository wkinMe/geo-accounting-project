import axios from 'axios';

export const instance = axios.create({
	baseURL: import.meta.env.API_URL,
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
				const response = await axios.get(`${import.meta.env.API_URL}/refresh`, {
					withCredentials: true,
				});
				if (response.status === 200) {
					return instance.request(originalResponse);
				}
			} catch (e) {
				throw new Error('Не авторизован');
			}
		}
	}
);
