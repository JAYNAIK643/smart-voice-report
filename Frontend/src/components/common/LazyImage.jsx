import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * LazyImage Component - Mobile Experience Enhancement
 * Lazy loading images with Intersection Observer
 * 
 * Features:
 * - Intersection Observer for efficient loading
 * - Blur-up placeholder effect
 * - Fade-in animation on load
 * - Error state with retry
 * - Aspect ratio preservation
 * - Object-fit support
 */

const LazyImage = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  aspectRatio = '16/9',
  objectFit = 'cover',
  placeholder = 'blur',
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Intersection Observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
    onError?.();
  }, [onError]);

  // Retry loading
  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoaded(false);
    setRetryCount(prev => prev + 1);
  }, []);

  // Generate placeholder style
  const getPlaceholderStyle = () => {
    if (placeholder === 'blur') {
      return {
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite'
      };
    }
    return {};
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-muted ${containerClassName}`}
      style={{ aspectRatio }}
    >
      {/* Shimmer animation styles */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Placeholder */}
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center"
            style={getPlaceholderStyle()}
          >
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual image */}
      {isInView && (
        <motion.img
          key={`${src}-${retryCount}`}
          ref={imgRef}
          src={src}
          alt={alt}
          className={`w-full h-full transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          style={{ objectFit }}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted"
        >
          <AlertCircle className="w-8 h-8 text-destructive" />
          <span className="text-xs text-muted-foreground">Failed to load</span>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default LazyImage;
