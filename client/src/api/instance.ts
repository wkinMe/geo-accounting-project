// client/src/api/instance.ts
import axios from 'axios';

export const instance = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
	resolve: (value?: unknown) => void;
	reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
	failedQueue.forEach((promise) => {
		if (error) {
			promise.reject(error);
		} else {
			promise.resolve(token);
		}
	});
	failedQueue = [];
};

instance.interceptors.request.use((config) => {
	const token = localStorage.getItem('token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

instance.interceptors.response.use(
	(response) => {
		return response;
	},
	async (error) => {
		const originalRequest = error.config;

		if (error?.response?.status !== 401 || originalRequest._retry) {
			return Promise.reject(error);
		}

		if (isRefreshing) {
			return new Promise((resolve, reject) => {
				failedQueue.push({ resolve, reject });
			})
				.then(() => {
					const token = localStorage.getItem('token');
					if (token) {
						originalRequest.headers.Authorization = `Bearer ${token}`;
					}
					return instance(originalRequest);
				})
				.catch((err) => Promise.reject(err));
		}

		originalRequest._retry = true;
		isRefreshing = true;

		try {
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/users/refresh`,
				{},
				{
					withCredentials: true,
				}
			);

			if (response.status === 200 && response.data?.data?.accessToken) {
				const newToken = response.data.data.accessToken;
				localStorage.setItem('token', newToken);

				originalRequest.headers.Authorization = `Bearer ${newToken}`;
				processQueue(null, newToken);

				return instance(originalRequest);
			} else {
				throw new Error('Invalid refresh response');
			}
		} catch (refreshError) {
			processQueue(
				refreshError instanceof Error ? refreshError : new Error('Refresh failed'),
				null
			);
			localStorage.removeItem('token');
			window.location.href = '/login';
			return Promise.reject(refreshError);
		} finally {
			isRefreshing = false;
		}
	}
);
