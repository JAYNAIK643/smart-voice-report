import { useEffect, useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * InfiniteScroll Component - Mobile Experience Enhancement
 * Infinite scrolling with Intersection Observer for performance
 * 
 * Features:
 * - Intersection Observer for efficient scroll detection
 * - Loading skeleton during fetch
 * - Error state with retry
 * - End of list indicator
 * - Threshold configuration
 * - Debounced loading
 */

const InfiniteScroll = ({
  children,
  loadMore,
  hasMore,
  loader,
  threshold = 200,
  className = '',
  endMessage = "You've reached the end",
  errorMessage = "Failed to load more items",
  retryMessage = "Try again"
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const isLoadingRef = useRef(false);

  // Load more wrapper with error handling
  const handleLoadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;
    
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      await loadMore();
    } catch (err) {
      console.error('Infinite scroll load error:', err);
      setError(err.message || errorMessage);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [loadMore, hasMore, errorMessage]);

  // Intersection Observer setup
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoadingRef.current && !error) {
        handleLoadMore();
      }
    }, options);

    observerRef.current = observer;

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleLoadMore, hasMore, threshold, error]);

  // Retry handler
  const handleRetry = useCallback(() => {
    setError(null);
    handleLoadMore();
  }, [handleLoadMore]);

  // Default loader
  const defaultLoader = (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Loading more...</span>
    </div>
  );

  return (
    <div className={className}>
      {children}
      
      {/* Loading state */}
      {isLoading && (loader || defaultLoader)}
      
      {/* Error state */}
      {error && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-8 gap-3"
        >
          <AlertCircle className="w-8 h-8 text-destructive" />
          <span className="text-sm text-muted-foreground text-center px-4">
            {error}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {retryMessage}
          </Button>
        </motion.div>
      )}
      
      {/* End of list message */}
      {!hasMore && !isLoading && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-8"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-12 h-px bg-border" />
            <span>{endMessage}</span>
            <div className="w-12 h-px bg-border" />
          </div>
        </motion.div>
      )}
      
      {/* Intersection observer target */}
      {hasMore && !error && (
        <div 
          ref={loadMoreRef} 
          className="h-4 w-full"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default InfiniteScroll;
