import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiGetTermOfService } from '../../services/terms/terms';
import type { ToSResponse } from '../../types/data/terms/term.type';

type UseTermOfServiceResult = {
  data: ToSResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export const useTermOfService = (): UseTermOfServiceResult => {
  const [data, setData] = useState<ToSResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const GetTos = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await apiGetTermOfService({ signal: controller.signal });
      setData(res);
    } catch (e: unknown) {
      if (controller.signal.aborted) return;
      setError(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    GetTos();

    return () => {
      abortRef.current?.abort();
    };
  }, [GetTos]);

  const refetch = useMemo(() => GetTos, [GetTos]);

  return { data, loading, error, refetch };
};
