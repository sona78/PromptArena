"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchData: (page: number, limit: number) => Promise<{
    data: T[];
    hasMore: boolean;
    nextPage?: number;
  }>;
  limit?: number;
  initialData?: T[];
  threshold?: number;
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function useInfiniteScroll<T>({
  fetchData,
  limit = 20,
  initialData = [],
  threshold = 100
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchData(page, limit);

      if (result.data.length === 0) {
        setHasMore(false);
      } else {
        setData(prev => [...prev, ...result.data]);
        setHasMore(result.hasMore);
        setPage(prev => prev + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchData, page, limit, hasMore]);

  const refresh = useCallback(async () => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    loadingRef.current = false;

    // Trigger initial load
    setTimeout(() => {
      loadMore();
    }, 0);
  }, [loadMore]);

  // Intersection Observer for automatic loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      {
        root: container,
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    );

    // Create a sentinel element at the bottom
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    sentinel.className = 'infinite-scroll-sentinel';
    container.appendChild(sentinel);
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (container.contains(sentinel)) {
        container.removeChild(sentinel);
      }
    };
  }, [hasMore, loading, loadMore, threshold]);

  // Scroll event listener as fallback
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;

      if (isNearBottom && hasMore && !loading) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, loadMore, threshold]);

  // Initial load
  useEffect(() => {
    if (data.length === 0 && !loading && hasMore) {
      loadMore();
    }
  }, [data.length, loading, hasMore, loadMore]);

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    refresh,
    containerRef
  };
}