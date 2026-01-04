/**
 * Generic API call hook with loading and error states
 */

import { useState, useCallback } from 'react';
import { ApiError } from '@/types/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

interface UseApiReturn<T, Args extends unknown[] = unknown[]> extends UseApiState<T> {
  execute: (...args: Args) => Promise<T | undefined>;
  reset: () => void;
}

export function useApi<T, Args extends unknown[] = unknown[]>(
  apiFunction: (...args: Args) => Promise<T>
): UseApiReturn<T, Args> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | undefined> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await apiFunction(...args);
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const apiError = error as ApiError;
        setState({ data: null, loading: false, error: apiError });
        return undefined;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

