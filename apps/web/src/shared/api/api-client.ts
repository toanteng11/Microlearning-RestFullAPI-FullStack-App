import { publicConfig } from '../config/public-config';
import { ApiError, type ApiErrorDetail } from './api-error';

interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetail[];
  };
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  accessToken?: string | null;
  responseType?: 'json' | 'blob';
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, accessToken, headers, responseType = 'json', ...requestOptions } = options;
  const response = await fetch(`${publicConfig.apiBaseUrl}/api/v1${path}`, {
    ...requestOptions,
    credentials: 'include',
    headers: {
      Accept: responseType === 'blob' ? 'text/csv' : 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 204) return undefined as T;
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorEnvelope;
    const envelope = payload as ApiErrorEnvelope;
    throw new ApiError(
      response.status,
      envelope.error?.code ?? 'UNEXPECTED_API_ERROR',
      envelope.error?.message ?? 'Không thể hoàn thành yêu cầu.',
      envelope.error?.details ?? [],
    );
  }
  if (responseType === 'blob') return (await response.blob()) as T;
  const payload = (await response.json().catch(() => ({}))) as T;
  return payload as T;
}
