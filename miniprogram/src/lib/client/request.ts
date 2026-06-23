import Taro from '@tarojs/taro';
import { API_BASE_URL } from '@/config';
import { getSessionToken } from '@/lib/auth';

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

type RequestOptions<TData> = {
  url: string;
  method?: keyof Taro.request.Method;
  data?: TData;
  header?: Record<string, string>;
  auth?: boolean;
};

function getErrorMessage(statusCode: number, payload: unknown) {
  if (payload && typeof payload === 'object') {
    const data = payload as ApiErrorPayload;
    return data.error || data.message || `请求失败：${statusCode}`;
  }

  return `请求失败：${statusCode}`;
}

export async function request<TResponse, TData = unknown>({
  url,
  method = 'GET',
  data,
  header,
  auth = true,
}: RequestOptions<TData>): Promise<TResponse> {
  const token = auth ? getSessionToken() : null;
  const response = await Taro.request<TResponse>({
    url: `${API_BASE_URL}${url}`,
    method,
    data,
    header: {
      ...header,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new ApiRequestError(
      getErrorMessage(response.statusCode, response.data),
      response.statusCode,
      response.data,
    );
  }

  return response.data;
}
