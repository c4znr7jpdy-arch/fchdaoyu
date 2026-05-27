import type { TowerBattleContext } from '@shared/lib/tower';
import { useEffect, useState } from 'react';

export function useTowerBattleContext(battleId: string | null) {
  const [context, setContext] = useState<TowerBattleContext | null>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(Boolean(battleId));

  useEffect(() => {
    if (!battleId) {
      setContext(null);
      setError('缺少幻境战局标识');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(undefined);
        const response = await fetch(
          `/api/tower/battle/context?battleId=${encodeURIComponent(battleId)}`,
        );
        const data = (await response.json()) as TowerBattleContext & {
          error?: string;
        };

        if (cancelled) return;
        if (!response.ok || data.error) {
          throw new Error(data.error || '读取幻境战局失败');
        }

        setContext(data);
      } catch (requestError) {
        if (cancelled) return;
        setContext(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : '读取幻境战局失败',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [battleId]);

  return {
    context,
    error,
    loading,
  };
}
