import { fetchJsonCached } from '@app/lib/client/requestCache';
import { useEffect, useState } from 'react';

export interface LifespanStatus {
  dailyLimit: number;
  consumed: number;
  remaining: number;
  isInRetreat: boolean;
}

interface UseLifespanStatusOptions {
  cultivatorId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onStatusLoaded?: (status: LifespanStatus) => void;
}

export function useLifespanStatus({
  cultivatorId,
  autoRefresh = false,
  refreshInterval = 60000,
  onStatusLoaded,
}: UseLifespanStatusOptions) {
  const [status, setStatus] = useState<LifespanStatus | null>(null);
  const [loading, setLoading] = useState(Boolean(cultivatorId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cultivatorId) {
      return;
    }

    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const result = await fetchJsonCached<{
          success: boolean;
          data?: LifespanStatus;
          error?: string;
        }>(`/api/cultivator/lifespan-status`, {
          key: `home:lifespan-status:${cultivatorId}`,
          ttlMs: autoRefresh ? Math.min(refreshInterval, 5000) : 30 * 1000,
        });

        if (cancelled) return;

        if (result.success && result.data) {
          setStatus(result.data);
          setError(null);
          onStatusLoaded?.(result.data);
        } else {
          throw new Error(result.error || '获取寿元状态失败');
        }
      } catch (err) {
        if (cancelled) return;
        console.error('获取寿元状态失败:', err);
        setError(err instanceof Error ? err.message : '获取失败');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchStatus();

    if (autoRefresh && refreshInterval > 0) {
      const timer = setInterval(fetchStatus, refreshInterval);
      return () => {
        cancelled = true;
        clearInterval(timer);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [autoRefresh, cultivatorId, onStatusLoaded, refreshInterval]);

  return {
    status,
    loading,
    error,
  };
}
