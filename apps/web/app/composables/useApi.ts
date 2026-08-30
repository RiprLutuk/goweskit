import type { ApiErrorResponse } from '@goweskit/contracts';

type ApiMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestOptions {
  method: ApiMethod;
  body?: unknown;
}

export function useApi() {
  const config = useRuntimeConfig();

  return async function request<T>(
    path: string,
    options?: ApiRequestOptions,
  ): Promise<T> {
    const headers: Record<string, string> = {};
    if (import.meta.server) {
      const reqHeaders = useRequestHeaders(['cookie']);
      if (reqHeaders.cookie) {
        headers.cookie = reqHeaders.cookie;
      }
    }

    const baseOptions = {
      baseURL: config.public.apiBaseUrl,
      credentials: 'include' as const,
      headers,
    };

    if (options === undefined) {
      return $fetch<T>(path, baseOptions);
    }

    if (options.body === undefined) {
      return $fetch<T>(path, { ...baseOptions, method: options.method });
    }

    return $fetch<T>(path, {
      ...baseOptions,
      method: options.method,
      body: options.body as Record<string, unknown>,
    });
  };
}

export function getApiError(error: unknown): ApiErrorResponse | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'error' in error.data
  ) {
    return error.data as ApiErrorResponse;
  }
  return null;
}

export function getApiErrorMessage(error: unknown): string {
  return (
    getApiError(error)?.error.message ??
    'We could not complete that request. Try again.'
  );
}
