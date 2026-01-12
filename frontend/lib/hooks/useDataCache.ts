/**
 * Data caching hook with stale-while-revalidate pattern
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_STALE_TIME = 10 * 60 * 1000; // 10 minutes

class DataCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTtl: number;
  private defaultStaleTime: number;

  constructor(defaultTtl: number = DEFAULT_TTL, defaultStaleTime: number = DEFAULT_STALE_TIME) {
    this.defaultTtl = defaultTtl;
    this.defaultStaleTime = defaultStaleTime;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    // If data is fresh, return it
    if (age < this.defaultTtl) {
      return entry.data;
    }

    // If data is stale but within stale time, return it but trigger revalidation
    if (age < this.defaultStaleTime) {
      return entry.data;
    }

    // Data is too old, remove it
    this.cache.delete(key);
    return null;
  }

  set<T>(key: string, data: T, options?: CacheOptions): void {
    const ttl = options?.ttl || this.defaultTtl;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Auto-remove after TTL
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  setPromise<T>(key: string, promise: Promise<T>): void {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (entry) {
      entry.promise = promise;
    } else {
      this.cache.set(key, {
        data: null as T,
        timestamp: Date.now(),
        promise,
      });
    }
  }

  getPromise<T>(key: string): Promise<T> | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    return entry?.promise || null;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;

    const age = Date.now() - entry.timestamp;
    return age >= this.defaultTtl;
  }
}

// Global cache instance
const globalCache = new DataCache();

export function useDataCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (force = false) => {
    // Check cache first
    if (!force) {
      const cached = globalCache.get<T>(key);
      if (cached !== null) {
        setData(cached);
        setLoading(false);
        setError(null);

        // If stale, revalidate in background
        if (globalCache.isStale(key)) {
          fetchData(true).catch(() => {
            // Silently fail background refresh
          });
        }
        return;
      }

      // Check if there's already a pending request
      const pendingPromise = globalCache.getPromise<T>(key);
      if (pendingPromise) {
        try {
          const result = await pendingPromise;
          setData(result);
          setLoading(false);
          setError(null);
          return;
        } catch (err) {
          // Continue to fetch
        }
      }
    }

    // Fetch new data
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const promise = fetcher();
      globalCache.setPromise(key, promise);

      const result = await promise;

      if (!controller.signal.aborted) {
        globalCache.set(key, result, options);
        setData(result);
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [key, fetcher, options]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    globalCache.invalidate(key);
    setData(null);
  }, [key]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
  };
}

export { globalCache };
