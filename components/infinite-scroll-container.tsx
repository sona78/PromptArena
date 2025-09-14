"use client";

import { ReactNode } from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';

interface InfiniteScrollContainerProps<T> {
  fetchData: (page: number, limit: number) => Promise<{
    data: T[];
    hasMore: boolean;
    nextPage?: number;
  }>;
  renderItem: (item: T, index: number) => ReactNode;
  renderEmpty?: () => ReactNode;
  renderError?: (error: string, retry: () => void) => ReactNode;
  renderLoading?: () => ReactNode;
  limit?: number;
  threshold?: number;
  className?: string;
  itemClassName?: string;
  loadingClassName?: string;
}

export function InfiniteScrollContainer<T>({
  fetchData,
  renderItem,
  renderEmpty,
  renderError,
  renderLoading,
  limit = 20,
  threshold = 100,
  className = '',
  itemClassName = '',
  loadingClassName = ''
}: InfiniteScrollContainerProps<T>) {
  const {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    refresh,
    containerRef
  } = useInfiniteScroll({
    fetchData,
    limit,
    threshold
  });

  const defaultEmpty = () => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-400">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-500" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No items found</h3>
        <p className="text-sm">There are no items to display at this time.</p>
      </div>
    </div>
  );

  const defaultError = (errorMessage: string, retry: () => void) => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-400">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">Error loading data</h3>
        <p className="text-sm mb-4">{errorMessage}</p>
        <Button
          variant="outline"
          onClick={retry}
          className="text-gray-300 border-gray-600 hover:bg-gray-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );

  const defaultLoading = () => (
    <div className={`flex items-center justify-center p-4 ${loadingClassName}`}>
      <Loader2 className="w-5 h-5 animate-spin text-blue-400 mr-2" />
      <span className="text-sm text-gray-400">Loading more...</span>
    </div>
  );

  // Show error state
  if (error && data.length === 0) {
    return (
      <div className={`h-full ${className}`}>
        {renderError ? renderError(error, refresh) : defaultError(error, refresh)}
      </div>
    );
  }

  // Show empty state
  if (!loading && data.length === 0) {
    return (
      <div className={`h-full ${className}`}>
        {renderEmpty ? renderEmpty() : defaultEmpty()}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`h-full overflow-y-auto ${className}`}
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Render items */}
      <div className="space-y-1">
        {data.map((item, index) => (
          <div key={index} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="sticky bottom-0">
          {renderLoading ? renderLoading() : defaultLoading()}
        </div>
      )}

      {/* End message */}
      {!hasMore && data.length > 0 && (
        <div className="flex items-center justify-center p-4 text-gray-500">
          <div className="text-center">
            <div className="w-full h-px bg-gray-700 mb-2"></div>
            <span className="text-xs">No more items to load</span>
          </div>
        </div>
      )}

      {/* Error indicator for additional pages */}
      {error && data.length > 0 && (
        <div className="flex items-center justify-center p-4">
          <Button
            variant="ghost"
            onClick={loadMore}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Error loading more. Try again?
          </Button>
        </div>
      )}

      {/* Manual load more button (fallback) */}
      {!loading && hasMore && data.length > 0 && (
        <div className="flex items-center justify-center p-4">
          <Button
            variant="outline"
            onClick={loadMore}
            className="text-gray-300 border-gray-600 hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}