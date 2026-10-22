import {Platform} from 'react-native';

const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
export const API_BASE_URL = __DEV__ ? `http://${DEV_HOST}:8000/api/v1` : 'https://api.veyturn.com/api/v1';

type RequestOptions = {method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; accessToken?: string; authRetry?: boolean};
type TokenRefreshHandler = () => Promise<string>;

let tokenRefreshHandler: TokenRefreshHandler | null = null;
let refreshInFlight: Promise<string> | null = null;

export function setTokenRefreshHandler(handler: TokenRefreshHandler | null) {
  tokenRefreshHandler = handler;
}

async function refreshAccessToken() {
  if (!tokenRefreshHandler) throw new ApiError('Your session has expired. Please sign in again.', 401, null);
  if (!refreshInFlight) refreshInFlight = tokenRefreshHandler().finally(() => {refreshInFlight = null;});
  return refreshInFlight;
}

export class ApiError extends Error {
  status: number;
  details: unknown;
  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function firstError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Something went wrong. Please try again.';
  const record = data as Record<string, unknown>;
  if (typeof record.detail === 'string') return record.detail;
  for (const value of Object.values(record)) {
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    if (typeof value === 'string') return value;
  }
  return 'Something went wrong. Please try again.';
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const isFormData = options.body instanceof FormData;
    const requestBody: string | FormData | undefined = options.body === undefined ? undefined : isFormData ? options.body as FormData : JSON.stringify(options.body);
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(!isFormData ? {'Content-Type': 'application/json'} : {}),
        ...(options.accessToken ? {Authorization: `Bearer ${options.accessToken}`} : {}),
      },
      body: requestBody,
      signal: controller.signal,
    });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) {
      if (response.status === 401 && options.accessToken && !options.authRetry) {
        const accessToken = await refreshAccessToken();
        return apiRequest<T>(path, {...options, accessToken, authRetry: true});
      }
      throw new ApiError(firstError(data), response.status, data);
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new ApiError('The Veyturn server took too long to respond. Please try again.', 0, error);
    throw new ApiError('Cannot reach the Veyturn server. Check your connection and try again.', 0, error);
  } finally {
    clearTimeout(timeout);
  }
}

