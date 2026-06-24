import { request } from './request';

type HealthCheckResponse = {
  success: boolean;
  message?: string;
  redis?: 'up' | 'down' | string;
  error?: string;
};

export function getHealthCheck() {
  return request<HealthCheckResponse>({
    url: '/api/health-check',
    auth: false,
  });
}
