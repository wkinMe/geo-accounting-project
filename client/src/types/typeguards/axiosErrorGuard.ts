import type { ErrorResponse } from '@shared/types';
import { AxiosError } from 'axios';

export function isAxiosError<T = ErrorResponse>(error: unknown): error is AxiosError<T> {
	return error instanceof AxiosError;
}
